# tfl

![gif](https://github.com/jackharvey1/tfl/blob/master/demo.gif)

## Setup

### Prerequisites

In order to run you will need to get an app id and key by registering [here](https://api-portal.tfl.gov.uk/signup).

You will also need `mongodb` (available on brew) and `gulp` globally installed.

### Execution

Start your `mongodb` daemon

```shell
$ mongod
```

or if you installed with `brew`:

```shell
$ brew services start mongodb
```

You will need to have node 6+ installed

```shell
$ nvm use 6
```

Install dependencies

```shell
$ npm i
```

Then start the app

```shell
$ cd src
$ APP_ID=XXX APP_KEY=XXX gulp
```

Visit `localhost:3000` to see it in action.

## Terraform

In order to execute the terraform you will need to update the `provider` block in `main.tf` to reference your own profile, which can typically be found in `~/.aws/credentials`.

You will also need to enter your TfL API credentials into `terraform/.credentials` with the form

```
export APP_ID=XXXX
export APP_KEY=XXXX
```

Once you have done this, `cd` into `terraform/` and run `terraform plan` and `terraform apply`.
