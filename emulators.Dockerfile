FROM node
WORKDIR /app

RUN apt-get update && apt-get install default-jre -y
RUN npm install -g firebase-tools

COPY .firebaserc database.rules.json firebase.json firestore.* /app/
COPY ./dump /app/dump

EXPOSE 9099 8080 4000 9000

CMD [ "firebase", "emulators:start", "--import=./dump" ]
