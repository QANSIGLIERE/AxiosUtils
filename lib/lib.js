const axios = require('axios');
var { linkParser } = require('qansigliere-parse-link-from-headers');

function urlOptimization(baseURL, additionalPath) {
    if (!baseURL) {
        throw new Error('The base url is empty!');
    }

    if (additionalPath.includes(baseURL)) {
        baseURL = additionalPath;
        additionalPath = '';
    }

    let url =
        additionalPath.length > 0 && additionalPath[0] != '/'
            ? `${baseURL}/${additionalPath}`
            : `${baseURL}${additionalPath}`;

    console.log(url);

    return url;
}

function addResult(finalResults, serverResponse) {
    if (Array.isArray(serverResponse)) {
        finalResults.push(...serverResponse);
    } else {
        finalResults.push(serverResponse);
    }
}

async function get(baseURL, additionalPath, headers, returnAll = false, ignoreIssues = false) {
    let options = {
        url: urlOptimization(baseURL, additionalPath),
        method: 'GET',
        headers: headers,
        redirect: 'follow',
    };

    if (ignoreIssues)
        options['validateStatus'] = function (status) {
            return status <= 502;
        };

    // Measure the execution time
    let startTimer = Date.now();
    let response = await axios(options)
        .catch(function (error) {
            return error;
        })
        .finally(function (r) {
            return r;
        });
    let endTimer = Date.now() - startTimer;
    console.log(`Execution time: ${endTimer / 1000} seconds`);

    if (Object.keys(response).length <= 7) {
        if (returnAll) {
            return {
                status: response.status,
                response: Object.keys(response).length == 6 ? response.data : response.response.data,
                headers: Object.keys(response).length == 6 ? response.headers : response.response.headers,
                executionTime: endTimer,
            };
        } else {
            return Object.keys(response).length == 6 ? response.data : response.response.data;
        }
    } else {
        return response;
    }
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
    let options = {
        url: urlOptimization(baseURL, additionalPath),
        method: 'POST',
        data: jsonStringify ? JSON.stringify(json_body) : json_body,
        headers: headers,
        redirect: 'follow',
    };

    if (ignoreIssues)
        options['validateStatus'] = function (status) {
            return status <= 502;
        };

    // Measure the execution time
    let startTimer = Date.now();
    let response = await axios(options).catch(function (error) {
        return error;
    });
    let endTimer = Date.now() - startTimer;
    console.log(`Execution time: ${endTimer / 1000} seconds`);

    if (Object.keys(response).length <= 7) {
        if (returnAll) {
            return {
                status: response.status,
                response: Object.keys(response).length == 6 ? response.data : response.response.data,
                headers: Object.keys(response).length == 6 ? response.headers : response.response.headers,
                executionTime: endTimer,
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

function getNextLink(headersObject, responseObject, mode) {
    let finalResult = null;

    switch (mode) {
        case 'git':
            if (headersObject) {
                if (Object.keys(headersObject).includes('link')) {
                    let links = linkParser(headersObject);
                    if (Object.keys(links).includes('next')) {
                        if (Object.keys(links).includes('last')) {
                            if (links.next == links.past) {
                                finalResult = null;
                            } else {
                                finalResult = links.next;
                            }
                        } else {
                            finalResult = links.next;
                        }
                    }
                }
            }
            break;
        case 'revel':
            if (responseObject) {
                if (Object.keys(responseObject).includes('meta')) {
                    if (Object.keys(responseObject.meta).includes('next')) {
                        finalResult = responseObject.meta.next;
                    }
                }
                break;
            }
    }

    return finalResult;
}

async function downloadV2(baseURL, additionalPath, headers, mode) {
    let initialCall = await get(baseURL, additionalPath, headers, true);
    let finalResult = [];

    if (initialCall.status < 400) {
        addResult(finalResult, initialCall.response);
        let nextAdditionalPath = getNextLink(initialCall.headers, initialCall.response, mode);

        if (nextAdditionalPath) {
            while (nextAdditionalPath != null) {
                let nextCall = await get(baseURL, nextAdditionalPath, headers, true);
                addResult(finalResult, nextCall.response);

                if (nextCall.status < 400) {
                    nextAdditionalPath = getNextLink(nextCall.headers, nextCall.response, mode);
                } else {
                    nextAdditionalPath = null;
                }
            }
        }
    } else {
        finalResult = initialCall.response;
    }

    return finalResult;
}

function extractResults(results, keyToExtract) {
    return [].concat(...results.map(x => x[keyToExtract]));
}

module.exports.get = get;
module.exports.download = download;
module.exports.downloadV2 = downloadV2;
module.exports.post = post;
module.exports.extractResults = extractResults;
