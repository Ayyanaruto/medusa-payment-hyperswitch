#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to log info
log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

# Function to log success
log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to log error
log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to display a progress bar
progress_bar() {
    local duration=$1
    already_done() { for ((done=0; done<$elapsed; done++)); do printf "▇"; done }
    remaining() { for ((remain=$elapsed; remain<$duration; remain++)); do printf " "; done }
    percentage() { printf "| %s%%" $(( (($elapsed)*100)/($duration)*100/100 )); }
    for (( elapsed=1; elapsed<=$duration; elapsed++ )); do
        already_done; remaining; percentage
        sleep 0.1
        printf "\r"
    done
    printf "\n"
}

# Main setup function
setup_project() {
    # Clear screen
    clear

    # Welcome message
    echo -e "${MAGENTA}
   ╔═══════════════════════════════════════════════╗
   ║        Welcome to HyperSwitch + Medusa        ║
   ║         Payment Integration Setup Tool        ║
   ╚═══════════════════════════════════════════════╝
    ${NC}"

    # Prerequisite checks
    log_info "🔍 Checking prerequisites..."
    progress_bar 30

    # Check required tools
    for cmd in git npm psql yarn; do
        if ! command -v $cmd &> /dev/null; then
            log_error "❌ $cmd is not installed. Please install it and try again."
            exit 1
        fi
    done

    # Dependency installation
    log_info "📦 Installing project dependencies..."
    progress_bar 50
    npm install --force || {
        log_error "❌ Failed to install dependencies. Please check your npm setup."
        exit 1
    }

    # Additional dependencies installation
    log_info "📦 Installing additional dependencies..."
    progress_bar 50
    yarn add medusa-react @tanstack/react-query@4.22 @medusajs/medusa || {
        log_error "❌ Failed to install additional dependencies. Please check your yarn setup."
        exit 1
    }

    # Database configuration
    log_info "🛠️ Configuring Database..."

    # Prompt for database details
    read -p "Enter database host (default: localhost): " DB_HOST
    DB_HOST=${DB_HOST:-localhost}

    read -p "Enter database port (default: 5432): " DB_PORT
    DB_PORT=${DB_PORT:-5432}

    read -p "Enter database username (default: postgres): " DB_USER
    DB_USER=${DB_USER:-postgres}

    read -sp "Enter database password: " DB_PASSWORD
    echo  # New line

    while true; do
        read -p "Enter database name (default: medusa_store): " DB_NAME
        DB_NAME=${DB_NAME:-medusa_store}

        if psql -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
            log_error "❌ Database $DB_NAME already exists. Please choose a different name."
        else
            break
        fi
    done

    # Export database configuration for check-db.js
    export DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME

    # Create Database
    log_info "🛠️ Creating Database..."
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE \"$DB_NAME\"" || {
        log_error "❌ Failed to create database. Please check your PostgreSQL setup."
        exit 1
    }

    # Create .env file
    log_info "📝 Creating .env file..."
    cat > .env << EOL
STORE_CORS=http://localhost:8000,https://docs.medusajs.com
ADMIN_CORS=http://localhost:5173,http://localhost:9000,https://docs.medusajs.com
AUTH_CORS=http://localhost:5173,http://localhost:9000,https://docs.medusajs.com
REDIS_URL=redis://localhost:6379
JWT_SECRET=supersecret
COOKIE_SECRET=supersecret
DB_NAME=${DB_NAME}
DATABASE_URL=postgres://postgres@localhost/$DB_NAME
HYPERSWITCH_SECRET_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
EOL

    # Clone repository
    log_info "🔄 Cloning HyperSwitch Medusa Storefront repository..."
    progress_bar 30
    git clone https://github.com/Ayyanaruto/hyperswitch-medusa-storefront.git || {
        log_error "❌ Failed to clone repository. Please check your internet connection."
        exit 1
    }

    # After cloning change directory to hyperswitch-medusa-storefront
    cd hyperswitch-medusa-storefront
    git checkout medusa-starter-hyperswitch@v2 || {
        log_error "❌ Failed to checkout branch. Please check your git setup."
        exit 1
    }

    # Install dependencies
    log_info "📦 Installing storefront dependencies..."
    progress_bar 50
    yarn add || {
        log_error "❌ Failed to install dependencies. Please check your yarn setup."
        exit 1
    }
# Create .env file
    log_info "📝 Creating .env file..."
    cat > .env << EOL
    # Your Medusa backend, should be updated to where you are hosting your server. Remember to update CORS settings for your server. See – https://docs.medusajs.com/usage/configurations#admin_cors-and-store_cors
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000

# Your publishable key that can be attached to sales channels. See - https://docs.medusajs.com/development/publishable-api-keys

NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=
NEXT_PUBLIC_HYPERSWITCH_KEY=

# Your store URL, should be updated to where you are hosting your storefront.
NEXT_PUBLIC_BASE_URL=http://localhost:8000

# Your preferred default region. When middleware cannot determine the user region from the "x-vercel-country" header, the default region will be used. ISO-2 lowercase format.
NEXT_PUBLIC_DEFAULT_REGION=us

# Your Stripe public key. See – https://docs.medusajs.com/add-plugins/stripe
NEXT_PUBLIC_STRIPE_KEY=

# Your PayPal Client ID. See – https://docs.medusajs.com/add-plugins/paypal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=

# Your MeiliSearch / Algolia keys. See – https://docs.medusajs.com/add-plugins/meilisearch or https://docs.medusajs.com/add-plugins/algolia
NEXT_PUBLIC_FEATURE_SEARCH_ENABLED=false
NEXT_PUBLIC_SEARCH_APP_ID=
NEXT_PUBLIC_SEARCH_ENDPOINT=http://127.0.0.1:7700
NEXT_PUBLIC_SEARCH_API_KEY=
NEXT_PUBLIC_INDEX_NAME=products

# Your Next.js revalidation secret. See – https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#on-demand-revalidation
REVALIDATE_SECRET=supersecret

EOL
    # Change back to root directory
    cd ..

    # Final success message
    echo -e "\n${GREEN}✨ Setup Completed Successfully! ✨${NC}"
    log_success "🚀 Project is ready for development. Happy coding!"
}

# Run the setup
setup_project
