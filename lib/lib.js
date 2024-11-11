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

    let serverResponse = [200, 201, 202].includes(response.status) ? response.data : response.response.data;

    if (returnStatusCode) {
        return { status: response.status, response: serverResponse };
    } else {
        return serverResponse;
    }
}

async function download(baseURL, additionalPath, headers, keyToCollect, keyToNext, protocol = 'https') {
    // Prepare the first call
    let initialCall = await get(baseURL, additionalPath, headers, protocol, true);
    // Prepare an array for results
    let finalResult = [];

    if (initialCall.status < 400) {
        finalResult = [...initialCall['response'][keyToCollect]];

        if (Object.keys(initialCall.response).includes(keyToNext)) {
            if (initialCall['response'][keyToNext]['next']) {
                let nextAdditionalPath = initialCall['response'][keyToNext]['next'];
                while (nextAdditionalPath != null) {
                    let nextCall = await get(baseURL, nextAdditionalPath, headers, protocol, true);
                    if (nextCall.status < 400) {
                        finalResult.push(...nextCall['response'][keyToCollect]);
                        nextAdditionalPath = nextCall['response'][keyToNext]['next']
                            ? nextCall['response'][keyToNext]['next']
                            : null;
                    } else {
                        finalResult.push(...nextCall.response);
                        nextAdditionalPath = null;
                    }
                }
            }
        }
    } else {
        finalResult = initialCall.response;
    }

    return finalResult;
}

async function post(
    baseURL,
    additionalPath,
    json_body,
    headers,
    protocol = 'https',
    returnStatusCode = false,
    ignoreIssues = false,
) {
    let options = {
        url: `${protocol}://${baseURL}/${additionalPath}`,
        method: 'POST',
        data: JSON.stringify(json_body),
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

    let serverResponse = [200, 201, 202].includes(response.status) ? response.data : response.response.data;

    if (returnStatusCode) {
        return { status: response.status, response: serverResponse };
    } else {
        return serverResponse;
    }
}

module.exports.get = get;
module.exports.download = download;
module.exports.post = post;
