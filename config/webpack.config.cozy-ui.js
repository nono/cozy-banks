'use strict'

const { extractor } = require('./webpack.vars')
const webpack = require('webpack')
const autoprefixer = require('autoprefixer')
const path = require('path')

module.exports = {
  resolve: {
    extensions: ['.styl'],
    alias: {
      'cozy-ui/react': 'cozy-ui/dist/react'
    }
  },
  module: {
    rules: []
  },
  plugins: [
    new webpack.LoaderOptionsPlugin({
      options: {
        stylus: {
          use: [require('cozy-ui/stylus')()],
          import: ['settings/palette.styl']
        }
      }
    })
  ]
}
