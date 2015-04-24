//Author: Rodrigo Yanez
//
//Name: fluentify
//
module.exports = fluentify;

function fluentify(promiseFn, api) {
    var values = {};

    return function() {
        annotate(promiseFn, arguments);
        var result = promiseFn.apply(null, arguments);

        return extendWithApi(result);
    };

    function extendWithApi(promise) {
        for(var m in api) {
            promise[m] = function(m) {
                var args = Array.prototype.slice.call(arguments, 1);
                var p = promise.then(execute.bind(null, api[m], args));
                return extendWithApi(p);
            }.bind(promise, m);
        }

        return promise;
    }

    function annotate(fn, args) {
        getArgs(fn).reduce(function(memo, arg, i) {
            memo[arg] = args[i];
            return memo;
        }, values);
    }

    function execute(fn, callArgs, result) {
        var argNames = getArgs(fn),
            args = argNames.map(function(arg, index) {
                return index + 1 === argNames.length 
                    ? result 
                    : callArgs.length > index
                        ? callArgs[index]
                        : values[arg];
            });

        return fn.apply(null, args);
    }
}

// Borrowed from AngularJS injector
var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARG_SPLIT = /,/;
var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

function getArgs(fn) {
    var $inject = [],
        fnText,
        argDecl;

    fnText = fn.toString().replace(STRIP_COMMENTS, '');
    argDecl = fnText.match(FN_ARGS);

    argDecl[1].split(FN_ARG_SPLIT).forEach(function (arg) {
            arg.replace(FN_ARG, function (all, underscore, name) {
            $inject.push(name);
        });
    });

    return $inject;
}