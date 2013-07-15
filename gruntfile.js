module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    
    jshint: {
      options: {
        curly: false,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        eqnull: true,
        browser: true,
        expr: true,
        globals: {
          head: false,
          module: false,
          console: false
        }
      },

      files: [ 'gruntfile.js', 'src/js/**/*.js' ]
    },

    sass: {
      dist: {
        files: {
          'build/css/leap-manager.css': 'src/scss/leap-manager.scss'
        }
      }
    },

    cssmin: {
      compress: {
        files: {
          'build/css/leap-manager.min.css': 'build/css/leap-manager.css'
        }
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },

      dist: {
        files: [
          { src: 'src/js/leap-manager.js', dest: 'build/js/leap-manager.min.js'}
        ]
      }
    },

    watch: {
      scripts: {
        files: 'src/**/*.js',
        tasks: ['jshint', 'uglify'],
        options: {
          interrupt: true,
        }
      },

      scss: {
        files: 'src/**/*.scss',
        tasks: ['sass', 'cssmin'],
        options: {
          interrupt: true,
        }
      }
    },

    connect: {
      server: {
        options: {
          port: 8001,
          base: '.'
        }
      }
    }

  });

  grunt.loadNpmTasks( 'grunt-contrib-jshint' );
  grunt.loadNpmTasks( 'grunt-contrib-sass' );
  grunt.loadNpmTasks( 'grunt-contrib-cssmin' );
  grunt.loadNpmTasks( 'grunt-contrib-uglify');
  grunt.loadNpmTasks( 'grunt-contrib-connect' );
  grunt.loadNpmTasks( 'grunt-contrib-watch' );
  
  grunt.registerTask( 'default', [ 'jshint', 'sass', 'cssmin', 'uglify' ] );
  grunt.registerTask( 'serve', [ 'connect', 'watch' ] );
};