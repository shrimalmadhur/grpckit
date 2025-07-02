import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
// Note: grpc-js-reflection-client import will be handled at runtime
// For now, we'll create a simple mock implementation
import * as fs from 'fs';

const logFile = '/tmp/grpckit-debug.log';
function fileLog(...args: any[]) {
  fs.appendFileSync(logFile, args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ') + '\n');
}

export interface GrpcService {
  name: string;
  methods: GrpcMethod[];
}

export interface GrpcMethod {
  name: string;
  requestType: string;
  responseType: string;
  requestStream: boolean;
  responseStream: boolean;
}

export interface GrpcStream {
  id: string;
  call: grpc.ClientDuplexStream<any, any> | grpc.ClientReadableStream<any> | grpc.ClientWritableStream<any>;
}

export interface ConnectionOptions {
  useTls?: boolean;
  caCert?: string;
  clientCert?: string;
  clientKey?: string;
  metadata?: Record<string, string>;
  deadline?: number;
}

export class GrpcEngine {
  private client: grpc.Client | null = null;
  private connectionUrl: string = '';
  private services: Map<string, GrpcService> = new Map();
  private streams: Map<string, GrpcStream> = new Map();
  private streamCounter = 0;
  private reflectionClient: any = null; // Store reflection client for method invocation

  async connect(url: string, options: ConnectionOptions = {}): Promise<void> {
    this.connectionUrl = url;
    
    let credentials: grpc.ChannelCredentials;
    
    if (options.useTls) {
      if (options.caCert && options.clientCert && options.clientKey) {
        // mTLS
        const caCert = fs.readFileSync(options.caCert);
        const clientCert = fs.readFileSync(options.clientCert);
        const clientKey = fs.readFileSync(options.clientKey);
        
        credentials = grpc.credentials.createSsl(
          caCert,
          clientKey,
          clientCert
        );
      } else {
        // TLS
        credentials = grpc.credentials.createSsl();
      }
    } else {
      // Insecure
      credentials = grpc.credentials.createInsecure();
    }

    this.client = new grpc.Client(url, credentials);
    
    // Test connection
    await new Promise<void>((resolve, reject) => {
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 5);
      
      this.client!.waitForReady(deadline, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
    this.services.clear();
    this.streams.clear();
  }

  async discover(): Promise<GrpcService[]> {
    fileLog('[grpcEngine] discover() called');
    if (!this.client) {
      fileLog('[grpcEngine] Not connected to gRPC server');
      throw new Error('Not connected to gRPC server');
    }

    const timeoutMs = 5000;
    let timeoutHandle: NodeJS.Timeout | null = null;
    let didTimeout = false;

    try {
      const { GrpcReflection } = require('grpc-js-reflection-client');
      const host = this.connectionUrl.replace(/^https?:\/\//, '');
      const credentials = grpc.credentials.createInsecure();
      this.reflectionClient = new GrpcReflection(host, credentials);

      fileLog('Attempting to discover services via reflection...');

      const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
        return new Promise((resolve, reject) => {
          timeoutHandle = setTimeout(() => {
            didTimeout = true;
            reject(new Error('Reflection discovery timed out'));
          }, ms);
          promise.then(
            (res) => {
              if (!didTimeout) {
                clearTimeout(timeoutHandle!);
                resolve(res);
              }
            },
            (err) => {
              if (!didTimeout) {
                clearTimeout(timeoutHandle!);
                reject(err);
              }
            }
          );
        });
      };

      const services = await withTimeout(this.reflectionClient.listServices(), timeoutMs) as any[];
      fileLog('Discovered services:', services);
      if (!services || services.length === 0) {
        fileLog('No services discovered via reflection.');
      }
      const result: GrpcService[] = [];

      for (const serviceName of services) {
        try {
          fileLog(`Getting methods for service: ${serviceName}`);
          const methods = await withTimeout(this.reflectionClient.listMethods(serviceName), timeoutMs) as any[];
          fileLog(`Methods for ${serviceName}:`, methods);
          const serviceMethods: GrpcMethod[] = methods.map((method: any) => ({
            name: method.name || '',
            requestType: method.inputType || '',
            responseType: method.outputType || '',
            requestStream: method.clientStreaming || false,
            responseStream: method.serverStreaming || false,
          }));
          result.push({
            name: serviceName,
            methods: serviceMethods,
          });
        } catch (error) {
          fileLog(`Failed to get methods for service ${serviceName}:`, error);
          result.push({
            name: serviceName,
            methods: [],
          });
        }
      }
      fileLog('Final discovered services:', result);
      if (result.length === 0) {
        fileLog('No usable services found after reflection.');
      }
      
      // Store the discovered services in the services Map for method invocation
      this.services.clear();
      for (const service of result) {
        this.services.set(service.name, service);
        fileLog(`Stored service: ${service.name} with ${service.methods.length} methods`);
      }
      
      return result;
    } catch (error) {
      fileLog('gRPC reflection not available or failed:', error);
      if (error instanceof Error) {
        fileLog('Reflection error message:', error.message);
      }
      return [];
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
  }

  async invokeUnary(
    serviceName: string,
    methodName: string,
    request: any,
    options: { metadata?: Record<string, string>; deadline?: number } = {}
  ): Promise<any> {
    if (!this.reflectionClient) {
      throw new Error('Reflection client not available. Please discover services first.');
    }

    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const method = service.methods.find(m => m.name === methodName);
    if (!method) {
      throw new Error(`Method ${methodName} not found in service ${serviceName}`);
    }

    if (method.requestStream || method.responseStream) {
      throw new Error(`Method ${methodName} is not unary`);
    }

    try {
      fileLog(`[grpcEngine] Invoking ${serviceName}.${methodName} with request:`, request);
      
      // Get the proto descriptor for this service
      const descriptor = await this.reflectionClient.getDescriptorBySymbol(serviceName);
      
      // Create package object from descriptor
      const packageObject = descriptor.getPackageObject({
        keepCase: true,
        enums: String,
        longs: String,
        defaults: true,
        oneofs: true,
      });
      
      // Navigate to the service in the package object
      const serviceParts = serviceName.split('.');
      let serviceConstructor = packageObject;
      for (const part of serviceParts) {
        serviceConstructor = serviceConstructor[part];
        if (!serviceConstructor) {
          throw new Error(`Service ${serviceName} not found in package object`);
        }
      }
      
      // Create the gRPC client
      const grpcClient = new serviceConstructor(
        this.connectionUrl,
        grpc.credentials.createInsecure()
      );
      
      // Call the method
      const response = await new Promise((resolve, reject) => {
        const metadata = new grpc.Metadata();
        if (options.metadata) {
          Object.entries(options.metadata).forEach(([key, value]) => {
            metadata.set(key, value);
          });
        }

        const callOptions: any = {};
        if (options.deadline) {
          const deadline = new Date();
          deadline.setMilliseconds(deadline.getMilliseconds() + options.deadline);
          callOptions.deadline = deadline;
        }

        grpcClient[methodName](request, metadata, callOptions, (error: any, response: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });
      
      fileLog(`[grpcEngine] Response from ${serviceName}.${methodName}:`, response);
      return response;
    } catch (error) {
      fileLog(`[grpcEngine] Error invoking ${serviceName}.${methodName}:`, error);
      throw error;
    }
  }

  async invokeStream(
    serviceName: string,
    methodName: string,
    request: any,
    options: { metadata?: Record<string, string>; deadline?: number } = {}
  ): Promise<GrpcStream> {
    if (!this.client) {
      throw new Error('Not connected to gRPC server');
    }

    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const method = service.methods.find(m => m.name === methodName);
    if (!method) {
      throw new Error(`Method ${methodName} not found in service ${serviceName}`);
    }

    const metadata = new grpc.Metadata();
    if (options.metadata) {
      Object.entries(options.metadata).forEach(([key, value]) => {
        metadata.set(key, value);
      });
    }

    const callOptions: grpc.CallOptions = {};
    if (options.deadline) {
      const deadline = new Date();
      deadline.setMilliseconds(deadline.getMilliseconds() + options.deadline);
      callOptions.deadline = deadline;
    }

    let call: grpc.ClientDuplexStream<any, any> | grpc.ClientReadableStream<any> | grpc.ClientWritableStream<any>;

    if (method.requestStream && method.responseStream) {
      // Bidirectional streaming
      call = this.client.makeBidiStreamRequest(
        `/${serviceName}/${methodName}`,
        (arg: any) => Buffer.from(JSON.stringify(arg)),
        (buffer: Buffer) => JSON.parse(buffer.toString()),
        metadata,
        callOptions
      );
    } else if (method.requestStream) {
      // Client streaming
      call = this.client.makeClientStreamRequest(
        `/${serviceName}/${methodName}`,
        (arg: any) => Buffer.from(JSON.stringify(arg)),
        (buffer: Buffer) => JSON.parse(buffer.toString()),
        metadata,
        callOptions,
        () => {}
      );
    } else if (method.responseStream) {
      // Server streaming
      call = this.client.makeServerStreamRequest(
        `/${serviceName}/${methodName}`,
        (arg: any) => Buffer.from(JSON.stringify(arg)),
        (buffer: Buffer) => JSON.parse(buffer.toString()),
        request,
        metadata,
        callOptions
      );
    } else {
      throw new Error(`Method ${methodName} is not streaming`);
    }

    const streamId = `stream_${++this.streamCounter}`;
    const stream: GrpcStream = { id: streamId, call };
    this.streams.set(streamId, stream);

    return stream;
  }

  async importProto(filePath: string): Promise<GrpcService[]> {
    try {
      const packageDefinition = protoLoader.loadSync(filePath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });

      const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
      const services: GrpcService[] = [];

      for (const [packageName, packageObj] of Object.entries(protoDescriptor)) {
        if (typeof packageObj === 'object' && packageObj !== null) {
          for (const [serviceName, serviceObj] of Object.entries(packageObj)) {
            if (serviceObj && typeof serviceObj === 'object' && 'service' in serviceObj) {
              const methods: GrpcMethod[] = [];
              
              // Extract method information from the service definition
              // This is a simplified approach - in a real implementation,
              // you'd need to parse the proto file more thoroughly
              
              services.push({
                name: `${packageName}.${serviceName}`,
                methods,
              });
            }
          }
        }
      }

      return services;
    } catch (error) {
      throw new Error(`Failed to import proto file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getStream(streamId: string): GrpcStream | undefined {
    return this.streams.get(streamId);
  }

  closeStream(streamId: string): void {
    const stream = this.streams.get(streamId);
    if (stream) {
      stream.call.cancel();
      this.streams.delete(streamId);
    }
  }

  isConnected(): boolean {
    return this.client !== null;
  }

  getConnectionUrl(): string {
    return this.connectionUrl;
  }
} 