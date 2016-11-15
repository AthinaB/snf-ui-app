**************
Synnefo UI app
**************

`snf-ui-app` is the UI component of Synnefo IaaS platform.


Install
=======

Install `snf-ui-app` using ::

    $ apt-get install snf-ui-app

Apply ui settings in `/etc/synnefo/20-snf-ui-settings.conf` according
to your deployment needs.


Project status
==============

The package only includes the Pithos UI webapp.


Packaging
=========

The package is `devflow` ready. In order to be able to buld the package you
need to have a `nodejs` and `npm` installed on your system.

Node.js package for Debian systems is available via `nodesource.com`::

    $ cat << 'EOF' >> /etc/apt/sources.list.d/nodejs.list

    deb https://deb.nodesource.com/node_0.12 wheezy main
    deb-src https://deb.nodesource.com/node_0.12 wheezy main
    EOF

    $ curl -s https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add -
    $ apt-get install apt-transport-https
    $ apt-get update
    $ apt-get install nodejs

To create a `devflow` package go to the root of the project repo and run::

    $ devflow-autopkg


Development
===========
To develop in this frontend application we suggest to install [Synnefo](https://github.com/grnet/synnefo/). Then you need to modify the appropriate settings to serve the static files that you've worked on. To do this, follow these steps:

* Install [Synnefo](https://github.com/grnet/synnefo/) as the [developer guide](https://github.com/grnet/synnefo/blob/develop/docs/dev-guide.rst) describes. If you use the recommended installation method (snf-ci) the code of snf-ui-app will be installed by default in the path: `/var/tmp/snf-ui-app`

* Install snf-ui-app package in development mode:
```
  $ cd <installation_path>/snf-ui-app/
  $ python setup.py develop -N
```
* Let django serve the static files of the Synnefo components. This could be accomplished by adding in the file `/etc/synnefo/99-local.conf` the following line:
```
WEBPROJECT_SERVE_STATIC = True
```
Since this is a setting, you need to restart gunicorn:
```
$ service gunicorn restart
```
* Remove static file sharing settings from apache configuration. When you use `snf-ci`, by default, the settings that you can remove are placed in the file: `/etc/apache2/sites-available/synnefo-ssl`. There, comment out the lines:
```
Alias /static "/usr/share/synnefo/static"
ProxyPass        /static !
```
Then restart apache:
```
  $ /etc/init.d/apache2 restart
```
* Build ember project with explicit output location:
```
  $ cd <installation_path>/snf-ui-app/snf-ui
  $ ember build --watch --output-path ../synnefo_ui/static/snf-ui
```
