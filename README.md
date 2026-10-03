# Baby's Photobooth

A personal webcam photobooth with a floral portrait frame and a four-photo strip.

**Live site:** https://sharathtawakaka-arch.github.io/photoboothbb/

## Run locally

```bash
npm ci
npm start
```

Camera access is requested by the browser. Use `localhost` or HTTPS and allow camera permission when prompted.

## Deploy

In the repository settings, open **Pages** and set the build and deployment source to **GitHub Actions** once. GitHub restricts the workflow token from enabling Pages itself.

After that, pushing to `main` automatically builds and deploys the site using `.github/workflows/pages.yml`. You can also rerun the existing workflow from the Actions tab.
