#!/bin/bash

# Web Search Setup Script for Obsidian RAG
# This script helps you set up various web search providers

echo "🔍 Obsidian RAG Web Search Setup"
echo "================================="

# Function to setup SearXNG
setup_searxng() {
    echo ""
    echo "🦆 Setting up SearXNG (Recommended for personal use)"
    echo ""
    echo "SearXNG is a free, open-source metasearch engine that:"
    echo "✅ Runs locally and privately"
    echo "✅ Aggregates 70+ search engines"
    echo "✅ No API keys required"
    echo "✅ Respects user privacy"
    echo "✅ High rate limits"
    echo ""

    read -p "Do you want to install SearXNG locally? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Installing SearXNG with Docker..."

        # Check if Docker is installed
        if ! command -v docker &> /dev/null; then
            echo "❌ Docker is not installed. Please install Docker first."
            echo "Visit: https://docs.docker.com/get-docker/"
            return
        fi

        # Create docker-compose.yml for SearXNG
        cat > docker-compose.searxng.yml << 'EOF'
version: '3.8'
services:
  searxng:
    image: searxng/searxng:latest
    container_name: searxng
    ports:
      - "8888:8080"
    volumes:
      - ./searxng:/etc/searxng
    environment:
      - SEARXNG_BASE_URL=https://your-domain.com/
      - SEARXNG_SECRET=your-secret-key-here
    restart: unless-stopped
    networks:
      - searxng

networks:
  searxng:
    external: false
EOF

        echo "✅ Created docker-compose.searxng.yml"
        echo ""
        echo "To start SearXNG:"
        echo "1. Run: docker-compose -f docker-compose.searxng.yml up -d"
        echo "2. Access at: http://localhost:8888"
        echo "3. Generate a secret key: openssl rand -hex 32"
        echo "4. Update SEARXNG_SECRET in docker-compose.searxng.yml"
        echo ""

        # Set environment variables for Obsidian RAG
        echo "Setting environment variables for Obsidian RAG..."
        echo 'ENABLE_SEARXNG="true"' >> .env
        echo 'SEARXNG_URL="http://localhost:8888"' >> .env

        echo "✅ Environment variables set!"
        echo "🔄 Restart your Obsidian RAG server to enable SearXNG"
    fi
}

# Function to setup Google Custom Search
setup_google_search() {
    echo ""
    echo "🔍 Setting up Google Custom Search API"
    echo ""
    echo "Google Custom Search API provides:"
    echo "✅ Official Google search results"
    echo "✅ 100 free searches per day"
    echo "✅ Reliable and comprehensive results"
    echo "✅ Advanced search operators"
    echo ""

    echo "To set up Google Custom Search API:"
    echo "1. Go to: https://console.cloud.google.com/"
    echo "2. Create a new project or select existing"
    echo "3. Enable Custom Search API"
    echo "4. Go to: https://cse.google.com/"
    echo "5. Create a custom search engine"
    echo "6. Get your Search Engine ID (CX)"
    echo "7. Create API credentials in Google Cloud Console"
    echo ""

    read -p "Do you have your Google API Key and Search Engine ID? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your Google API Key: " api_key
        read -p "Enter your Search Engine ID (CX): " cx

        echo "Setting environment variables..."
        echo "GOOGLE_SEARCH_API_KEY=\"$api_key\"" >> .env
        echo "GOOGLE_SEARCH_CX=\"$cx\"" >> .env

        echo "✅ Google Custom Search configured!"
        echo "🔄 Restart your Obsidian RAG server to enable Google Search"
    fi
}

# Function to setup Serper API
setup_serper() {
    echo ""
    echo "⚡ Setting up Serper API"
    echo ""
    echo "Serper.dev provides:"
    echo "✅ Real-time Google search results"
    echo "✅ 2,500 free searches per month"
    echo "✅ JSON responses (no HTML parsing needed)"
    echo "✅ Fast and reliable"
    echo "✅ Good for development"
    echo ""

    echo "To set up Serper API:"
    echo "1. Go to: https://serper.dev/"
    echo "2. Sign up for a free account"
    echo "3. Get your API key"
    echo "4. Your free tier includes 2,500 searches/month"
    echo ""

    read -p "Do you have your Serper API Key? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your Serper API Key: " api_key

        echo "Setting environment variables..."
        echo "SERPER_API_KEY=\"$api_key\"" >> .env

        echo "✅ Serper API configured!"
        echo "🔄 Restart your Obsidian RAG server to enable Serper"
    fi
}

# Main menu
while true; do
    echo ""
    echo "Choose your web search provider:"
    echo "1) SearXNG (Recommended - Free, Local, Private)"
    echo "2) Google Custom Search API (Official, 100 free/day)"
    echo "3) Serper API (2,500 free/month, Fast)"
    echo "4) View current configuration"
    echo "5) Exit"
    echo ""
    read -p "Enter your choice (1-5): " -n 1 -r
    echo

    case $REPLY in
        1) setup_searxng ;;
        2) setup_google_search ;;
        3) setup_serper ;;
        4)
            echo "Current configuration:"
            if [ -f .env ]; then
                grep -E "(ENABLE_SEARXNG|GOOGLE_SEARCH|SERPER)" .env 2>/dev/null || echo "No web search providers configured"
            else
                echo "No .env file found"
            fi
            ;;
        5) break ;;
        *) echo "Invalid option. Please choose 1-5." ;;
    esac
done

echo ""
echo "Setup complete! 🚀"
echo "Don't forget to restart your Obsidian RAG server:"
echo "npm run dev"
