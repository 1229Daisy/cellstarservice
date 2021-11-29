若linux中需要使用wkhtmltox,则下载： wkhtmltox-0.12.4_linux-generic-amd64.tar.xz
链接地址为：https://github.com/wkhtmltopdf/wkhtmltopdf/releases/download/0.12.4/wkhtmltox-0.12.4_linux-generic-amd64.tar.xz
之后在代码中指定wkhtmltox的位置即可
启动mysql数据库：mysqld
启动mongo数据库：mongod --dbpath "D:\usr\local\data"
查看端口是否启动：telnet localhost 27017
安装热部署工具：npm i --global nodemon 
以热部署方式启动：nodemon app.js(如果找不到改命令，需要配置环境变量)