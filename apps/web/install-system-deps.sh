#!/bin/bash
# Install system dependencies required for Playwright Chromium

echo "🔧 Installing Chromium system dependencies..."
echo ""
echo "This requires sudo permissions and will install:"
echo "  - NSS libraries (libnspr4, libnss3)"
echo "  - GTK libraries (libatk, libgbm)"
echo "  - X11 libraries (libxcomposite, libxrandr, etc.)"
echo "  - Audio library (libasound2t64 on Ubuntu 24.04+)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "Installing via Playwright..."
sudo pnpm exec playwright install-deps chromium

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ System dependencies installed successfully!"
    echo ""
    echo "Now run your tests:"
    echo "  pnpm test:e2e:ui"
else
    echo ""
    echo "❌ Installation failed!"
    echo ""
    echo "Try manual installation instead:"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install -y libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2t64"
    exit 1
fi
