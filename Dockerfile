FROM node:21-alpine
WORKDIR /app
ADD . /app
RUN npm install
RUN chmod a+x /app/docker.sh
CMD ["/app/docker.sh"]