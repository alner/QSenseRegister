��� ���������������� � �������� ����� ���������� ������ pm2 (https://github.com/Unitech/pm2).

npm install pm2 -g

������ �������:

> pm2 start server.js

"����������" ������� (��������� �������)

> pm2 start server.js -i 4

-i <number of workers> 

������ ���������:

> pm2 list

������������� ��� �������� (�� �������, ���������������� ������� �����������)

> pm2 restart all

���

pm2 restart <app name>

> pm2 restart server

��������������� �������:

pm2 scale <app name> <n>

��������, 
> pm2 scale app +3
> pm2 scale app 

���������� ��� �������

> pm2 stop all

> pm2 kill
