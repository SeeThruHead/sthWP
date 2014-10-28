/*
 * slush-sthwp
 * https://github.com/SeeThruHead/slush-sthwp
 *
 * Copyright (c) 2014, Shane Keulen
 * Licensed under the MIT license.
 */

'use strict';

var gulp = require('gulp'),
    install = require('gulp-install'),
    conflict = require('gulp-conflict'),
    template = require('gulp-template'),
    rename = require('gulp-rename'),
    _ = require('underscore.string'),
    inquirer = require('inquirer'),
    shell = require('gulp-shell');

function format(string) {
    var username = string.toLowerCase();
    return username.replace(/\s/g, '');
}

var defaults = (function () {
    var homeDir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE,
        workingDirName = process.cwd().split('/').pop().split('\\').pop(),
        osUserName = homeDir && homeDir.split('/').pop() || 'root',
        configFile = homeDir + '/.gitconfig',
        user = {};
    if (require('fs').existsSync(configFile)) {
        user = require('iniparser').parseSync(configFile).user;
    }
    return {
        appName: workingDirName,
        userName: format(user.name) || osUserName,
        authorEmail: user.email || ''
    };
})();
gulp.task('getWordPress', function(cb) {
    return gulp.src('').pipe(shell(['wget http://wordpress.org/latest.tar.gz && mkdir src && tar -xzf latest.tar.gz --strip=1 -C src/ && rm latest.tar.gz']));
});
gulp.task('default', ['getWordPress'], function (done) {
    var prompts = [{
        name: 'appName',
        message: 'What is the name of your project?',
        default: defaults.appName
    },
    {
        type: 'confirm',
        name: 'useHacker',
        message: 'Would you like to use hacker You starter theme?',
    }, {
        name: 'appDescription',
        message: 'What is the description?'
    }, {
        name: 'appVersion',
        message: 'What is the version of your project?',
        default: '0.1.0'
    }, {
        name: 'authorName',
        message: 'What is the author name?',
    }, {
        name: 'authorEmail',
        message: 'What is the author email?',
        default: defaults.authorEmail
    }, {
        name: 'userName',
        message: 'What is the github username?',
        default: defaults.userName
    }, {
        type: 'confirm',
        name: 'moveon',
        message: 'Continue?'
    }];
    //Ask
    inquirer.prompt(prompts,
        function (answers) {
            if (!answers.moveon) {
                return done();
            }
            var globs = [__dirname + '/templates/**'];
            if (!answers.useHacker) {
                console.log(answers.useHacker);
                globs.push('!' + __dirname + '/templates/src/wp-content/themes/theme-hackeryou{,/**}');
            }
            answers.appNameSlug = _.slugify(answers.appName);
            gulp.src(globs)
                .pipe(template(answers))
                .pipe(rename(function (file) {
                    if (file.basename[0] === '_') {
                        file.basename = '.' + file.basename.slice(1);
                    }
                }))
                .pipe(conflict('./'))
                .pipe(gulp.dest('./'))
                .pipe(install())
                .on('end', function () {
                    done();
                });
        });
});
