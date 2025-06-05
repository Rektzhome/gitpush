# Deployment Guide untuk Vercel

## Prerequisites

1. **Vercel Account**: Daftar di [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push kode ke GitHub repository
3. **Environment Variables**: Siapkan environment variables yang diperlukan

## Environment Variables

Buat environment variables berikut di Vercel Dashboard:

```bash
# GitHub OAuth (Required)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Application URL (Required)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# GitHub Personal Access Token (Optional)
GITHUB_TOKEN=your_personal_access_token
```

## Deployment Steps

### Method 1: Vercel Dashboard (Recommended)

1. Login ke [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import repository dari GitHub
4. Configure project settings:
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install --legacy-peer-deps`
5. Add environment variables
6. Click "Deploy"

### Method 2: Vercel CLI

```bash
# Install Vercel CLI (sudah terinstall)
npm install -g vercel

# Login ke Vercel
vercel login

# Deploy preview
npm run preview

# Deploy production
npm run deploy
```

## Build Commands

```bash
# Development
npm run dev

# Type checking
npm run type-check

# Build production
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Analyze bundle
npm run build:analyze
```

## Features yang Sudah Dikonfigurasi

✅ **Vercel Analytics** - Web analytics
✅ **Speed Insights** - Performance monitoring
✅ **SEO Optimization** - Sitemap generation
✅ **Security Headers** - XSS protection
✅ **Bundle Analysis** - Size optimization
✅ **TypeScript** - Type checking
✅ **ESLint** - Code linting
✅ **Legacy Peer Deps** - Dependency compatibility

## Post-Deployment

1. **Verify deployment** di Vercel dashboard
2. **Test functionality** dengan GitHub OAuth
3. **Check analytics** di Vercel Analytics
4. **Monitor performance** dengan Speed Insights
5. **Update domain** di GitHub OAuth settings

## Troubleshooting

### Build Errors
- Check TypeScript errors: `npm run type-check`
- Check ESLint errors: `npm run lint`
- Check dependencies: `npm install --legacy-peer-deps`

### Runtime Errors
- Check environment variables di Vercel dashboard
- Check function logs di Vercel dashboard
- Verify GitHub OAuth configuration

### Performance Issues
- Run bundle analyzer: `npm run build:analyze`
- Check Speed Insights di Vercel dashboard
- Optimize images dan dependencies

## Support

Jika ada masalah deployment:
1. Check Vercel documentation
2. Check build logs di Vercel dashboard
3. Verify environment variables
4. Test locally dengan `npm run build`