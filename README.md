# AxiosUtils

This library is based on Javascript and it will contain some functions to make Rest API requests (GET / POST / PUT /
PATCH / DELETE)

## Author

https://www.youtube.com/@QANSIGLIERE/

## Installation

Using npm `npm i qansigliere-axios-utils`

## How to use it

### GET Method

`get(baseURL, additionalPath, headers, returnAll = false, ignoreIssues = false)`
- `baseURL` - The consistent part or the root of your website's address, example: "https://YourDomain.com"
- `additionalPath` - Path to a specific API resource
- `headers` - request headers
- `returnAll` - if it is true, the request will return an object with response status, headers and server response. if it is false, the request will return only the server response
- `ignoreIssues` - if it is true, then any response with status code >= 400 and <=502 will not be passed as exception

### POST Method

### PUT Method

### PATCH Method

### DELETE Method


### Improvements & Suggestions

https://forms.gle/gdmLP4tZnUZQW9u76

