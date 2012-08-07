/*global module:false*/
module.exports = function(grunt) {
    "use strict";

    // Project configuration.
    grunt.initConfig({
        meta: {
            version: '0.1.0'
        },
        lint: {
            files: ['*.js', 'script/**/*.js']
        },
        jshint: {
            options: {
                bitwise: true,
                camelcase: true,
                curly: true,
                eqeqeq: true,
                forin: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                noempty: true,
                nonew: true,
                plusplus: false,
                quotmark: true,
                regexp: true,
                undef: true,
                strict: false,
                trailing: true,
                
                // boss: true,
                sub: true,
                eqnull: true,
                
                browser: true,
                jquery: true
            },
            globals: {}
        }
    });

    // Default task.
    grunt.registerTask('default', 'lint');

};
