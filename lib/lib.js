const axios = require('axios');

async function get(
    baseURL,
    additionalPath,
    headers,
    protocol = 'https',
    returnStatusCode = false,
    ignoreIssues = false,
) {
    let options = {
        url: `${protocol}://${baseURL}/${additionalPath}`,
        method: 'GET',
        headers: headers,
        redirect: 'follow',
    };

    if (ignoreIssues)
        options['validateStatus'] = function (status) {
            return status <= 502;
        };

    let response = await axios(options).catch(function (error) {
        return error;
    });

    let serverResponse = response.status == 200 ? response.data : response.response.data;

    if (returnStatusCode) {
        return { status: response.status, respone: serverResponse };
    } else {
        return serverResponse;
    }
}

module.exports.get = get;
