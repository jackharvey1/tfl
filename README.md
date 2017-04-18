# tfl

![gif](http://i.imgur.com/vaELaUp.jpg)

## Setup

In order to run you will need to get an app id and key by registering [here](https://api-portal.tfl.gov.uk/signup). It will run without
but will have limits on it, which may be far too low to enable to application to run. You can then use these either as `APP_ID=` and
`APP_KEY=` or by creating a file `config/config.js` with the form

    module.exports = {
        'app': {
            'id': 'app-id',
            'key': 'app-key'
        }
    };

Then you will need to run `mongod`, `nvm use 6`, `npm i` and then `gulp` whilst in `/src`. 

Visit `localhost:3000` to see it in action.
