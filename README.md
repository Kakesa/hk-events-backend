# HK Events Backend

<!-- Auteur info -->
name: Espoir Kakesa
email: espoirkakesa2@gmail.com
url: https://espoir-kakesa.netlify.app


## Description

This is the backend service for the HK Events application, which manages event data and provides APIs for frontend consumption.
## Features
- RESTful API for event management
- User authentication and authorization
- Database integration with MongoDB
- Environment configuration using .env files
## Getting Started
### Prerequisites
- Node.js v14 or higher
- MongoDB instance
### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/hk-events-backend.git
2. Navigate to the project directory:
   ```bash
    cd hk-events-backend
3. Install dependencies:
   ```bash  
    npm install
4. Create a `.env` file in the root directory and add your environment variables:
   ```env   
    PORT=3000
    MONGODB_URI=mongodb://localhost:27017/hk-events
5. Start the server:
    ```bash  
     npm start
The server will be running at `http://localhost:3000`.
## API Documentation
Refer to the [API Documentation](docs/api.md) for detailed information on available endpoints and their usage.