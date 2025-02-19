const axios = require('axios');

async function get(baseURL, additionalPath, headers, returnAll = false, ignoreIssues = false) {
    let url =
        additionalPath.length > 0 && additionalPath[0] != '/'
            ? `${baseURL}/${additionalPath}`
            : `${baseURL}${additionalPath}`;
    console.log(url);

    let options = {
        url: url,
        method: 'GET',
        headers: headers,
        redirect: 'follow',
    };

    if (ignoreIssues)
        options['validateStatus'] = function (status) {
            return status <= 502;
        };

    let response = await axios(options)
        .catch(function (error) {
            return error;
        })
        .finally(function (r) {
            return r;
        });

    if (Object.keys(response).length <= 7) {
        if (returnAll) {
            return {
                status: response.status,
                response: Object.keys(response).length == 6 ? response.data : response.response.data,
                headers: Object.keys(response).length == 6 ? response.headers : response.response.headers,
            };
        } else {
            return Object.keys(response).length == 6 ? response.data : response.response.data;
        }
    } else {
        return response;
    }
}

async function download(baseURL, additionalPath, headers, keyToCollect, keyToNext) {
    // Prepare the first call
    let initialCall = await get(baseURL, additionalPath, headers, true);
    // Prepare an array for results
    let finalResult = [];

    if (initialCall.status < 400 && Object.keys(initialCall.response).includes(keyToCollect)) {
        finalResult = [...initialCall['response'][keyToCollect]];

        if (Object.keys(initialCall.response).includes(keyToNext)) {
            if (initialCall['response'][keyToNext]['next']) {
                let nextAdditionalPath = initialCall['response'][keyToNext]['next'];
                while (nextAdditionalPath != null) {
                    let nextCall = await get(baseURL, nextAdditionalPath, headers, true);
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
    returnAll = false,
    ignoreIssues = false,
    jsonStringify = true,
) {
    let url =
        additionalPath.length > 0 && additionalPath[0] != '/'
            ? `${baseURL}/${additionalPath}`
            : `${baseURL}${additionalPath}`;
    console.log(url);

    let options = {
        url: url,
        method: 'POST',
        data: jsonStringify ? JSON.stringify(json_body) : json_body,
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

    if (Object.keys(response).length <= 7) {
        if (returnAll) {
            return {
                status: response.status,
                response: Object.keys(response).length == 6 ? response.data : response.response.data,
                headers: Object.keys(response).length == 6 ? response.headers : response.response.headers,
            };
        } else {
            return Object.keys(response).length == 6 ? response.data : response.response.data;
        }
    } else {
        return response;
    }
}

module.exports.get = get;
module.exports.download = download;
module.exports.post = post;
