FROM node

ENV SOURCE_URL mysql://root:test@localhost/test
ENV SOURCE_QUERY stable
ENV DESTINATION_URL mysql://root:test@localhost/test
ENV DESTINATION_TABLE stable

COPY . /code

WORKDIR /code

RUN npm install -g n --silent

ENTRYPOINT ["./bootstrap.sh"]
