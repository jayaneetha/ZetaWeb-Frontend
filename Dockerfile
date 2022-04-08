FROM httpd:2.4.53-alpine

COPY ./build/ /usr/local/apache2/htdocs/
