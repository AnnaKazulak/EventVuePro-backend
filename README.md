# EvenVuePro Backend (Express API)

## Description
EvenVuePro is the backend (Express API) of a MERN web application that allows logged-in users to manage guests and events. Users can create, read, update, and delete guests, and associate them with events. This README is for the backend part of the application.

For the frontend (React) repository, you can find it [https://github.com/AnnaKazulak/EventVuePro-frontend](link-to-frontend-repo).

## Instructions to Run

1. First, clone this repository to your local machine:
git clone https://github.com/AnnaKazulak/EventVuePro-backend.git


2. Navigate to the project directory:
cd evenvuepro-backend


3. Install the required dependencies:
npm install


4. Create a `.env` file in the root directory and add the necessary environment variables.
* ORIGIN, with the location of your frontend app (example, ORIGIN=https://mycoolapp.netlify.com)
* TOKEN_SECRET: used to sign auth tokens (example, TOKEN_SECRET=ilovepizza)

5. Start the server:


The backend API will be accessible at `http://localhost:5000`.

## Demo
You can access the deployed version of EvenVuePro on Netlify for the frontend and adaptable/fly.io for the backend:
- Frontend: [https://event-vue-pro.netlify.app/](link-to-netlify-demo)
- Backend: [https://adaptable.io/app/appstatus?appId=8e94ac4e-d792-4051-b679-e8c5219bc6e5#status](link-to-backend-demo)

## API Documentation
You can find the API documentation and endpoints in this [Postman Collection](link-to-postman-collection) or refer to the frontend README for the link to the backend README with API documentation.

