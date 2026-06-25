# Use official Python image
FROM python:3.10-slim

# Install Node.js for frontend building
RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

# Set working directory
WORKDIR /app

# Copy the whole project
COPY . .

# Build the frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Install the backend dependencies using uv for extreme speed
WORKDIR /app/backend
RUN pip install uv
RUN uv pip install --system -r requirements.txt

# Expose the port
EXPOSE 5000

# Start the Flask server
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]
