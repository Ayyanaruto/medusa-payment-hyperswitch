#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log info
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Function to log success
log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to log error
log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Main setup function
setup_project() {
    # Clear screen
    clear

    # Welcome message
    echo -e "${YELLOW}===============================================${NC}"
    echo -e "${GREEN}HyperSwitch Medusa Storefront Setup Script${NC}"
    echo -e "${YELLOW}===============================================${NC}"

    # Prerequisite checks
    log_info "Checking prerequisites..."

    # Check required tools
    for cmd in git npm psql; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd is not installed"
            exit 1
        fi
    done

    # Dependency installation
    log_info "Installing project dependencies..."
    npm install --force || {
        log_error "Failed to install dependencies"
        exit 1
    }

    # Database configuration
    log_info "Configuring Database..."

    # Prompt for database details
    read -p "Enter database host (default: localhost): " DB_HOST
    DB_HOST=${DB_HOST:-localhost}

    read -p "Enter database port (default: 5432): " DB_PORT
    DB_PORT=${DB_PORT:-5432}

    read -p "Enter database username: " DB_USER

    read -sp "Enter database password: " DB_PASSWORD
    echo  # New line

    read -p "Enter database name (default: medusa_store): " DB_NAME
    DB_NAME=${DB_NAME:-medusa_store}

    # Export database configuration for check-db.js
    export DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME

    # Create .env file and HYPERSWITCH_SECRET_KEY's value
    log_info "Creating .env file..."
    cat > .env << EOL
STORE_CORS=http://localhost:8000,https://docs.medusajs.com
ADMIN_CORS=http://localhost:5173,http://localhost:9000,https://docs.medusajs.com
AUTH_CORS=http://localhost:5173,http://localhost:9000,https://docs.medusajs.com
REDIS_URL=redis://localhost:6379
JWT_SECRET=supersecret
COOKIE_SECRET=supersecret
DB_NAME=${DB_NAME}
DATABASE_URL=postgres://postgres@localhost/$DB_NAME
HYPERSWITCH_SECRET_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
EOL

    # Clone repository
    log_info "Cloning HyperSwitch Medusa Storefront repository..."
    git clone https://github.com/Ayyanaruto/hyperswitch-medusa-storefront.git || {
        log_error "Failed to clone repository"
        exit 1
    }

    # Final success message
    echo -e "\n${GREEN}✨ Setup Completed Successfully! ✨${NC}"
    log_success "Project is ready for development"
}

# Run the setup
setup_project
