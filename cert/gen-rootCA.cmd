@echo off
set opensslConf=%2
openssl genrsa -out rootCA.key 2048
openssl req -x509 -new -nodes -key rootCA.key -days 36500 -out rootCA.crt \
    -subj "/C=CN/ST=SH/L=SH/O=AnyProxy/OU=Section/CN=Anyproxy SSL Proxying/emailAddress=AnyProxy@AnyProxy" \
    -config %opensslConf% \
    -extensions v3_ca
echo =============
echo rootCA generated at :
echo %cd%
echo =============

start .

rem exit 0
