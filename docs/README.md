# GRPCKit Website

This is the GitHub Pages website for GRPCKit, a modern gRPC client for desktop.

## Structure

```
docs/
├── index.html          # Main landing page
├── styles/
│   └── main.css        # Website styles
├── scripts/
│   └── main.js         # Website functionality
├── assets/
│   ├── logo.svg        # GRPCKit logo
│   ├── logo.png        # PNG version of logo
│   ├── app-screenshot.png  # App screenshot
│   └── favicon.ico     # Favicon
├── _config.yml         # Jekyll configuration
└── README.md          # This file
```

## Features

- **Responsive Design**: Works on all devices (desktop, tablet, mobile)
- **Dark/Light Theme**: Automatically adapts to system theme
- **Modern UI**: Clean, professional design with animations
- **Download Tracking**: Tracks download button clicks
- **SEO Optimized**: Proper meta tags and Open Graph support
- **Performance**: Optimized for fast loading

## Updating the Website

### Content Updates

1. **Hero Section**: Edit the hero section in `index.html`
2. **Features**: Update the features grid in `index.html`
3. **Download Links**: Update download URLs in the download section
4. **Screenshots**: Replace `assets/app-screenshot.png` with new app screenshots

### Styling Updates

1. **Colors**: Update CSS variables in `styles/main.css`
2. **Typography**: Modify font settings in CSS
3. **Layout**: Adjust grid layouts and spacing

### Adding New Sections

1. Add new HTML section in `index.html`
2. Add corresponding CSS styles in `styles/main.css`
3. Add navigation link if needed

## GitHub Pages Setup

1. Enable GitHub Pages in repository settings
2. Set source to `docs` folder
3. Website will be available at `https://username.github.io/repository-name/`

## Development

To test locally:
1. Serve the `docs` folder with a local web server
2. Or use Jekyll: `bundle exec jekyll serve` from the docs directory

## Assets

- Logo: SVG format for crisp display at all sizes
- Screenshot: PNG format, recommended size 1200x800px
- Favicon: ICO format for broad browser support

## SEO

The website includes:
- Proper meta tags
- Open Graph tags for social media
- Twitter Card support
- Sitemap generation (via Jekyll)
- Semantic HTML structure

## Performance

- Optimized images
- Minified CSS/JS (in production)
- Proper caching headers
- Lazy loading for images
- Efficient animations

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## License

Same license as the main GRPCKit project. 