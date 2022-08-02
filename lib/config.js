/*
 * Create and export configuration variables
 */

// Container for all environments
const environments = {}

// Staging (default) environment
environments.staging = {
  'httpPort' : 3002,
  'httpsPort' : 3003,
  'envName' : 'staging',
  'hashingSecret' : 'thisIsASecret',
  'stripe' : {
    'secret' : 'sk_test_4eC39HqLyjWDarjtT1zdp7dc'
  },
  'mailgun' : {
    'domain' : 'sandbox69e304372d9c47719fd5ca06385b883a.mailgun.org',
    'secret' : 'YXBpOjQ5ZjYwMTkxZDMzMmE2OWNjNDdjNGU4M2JhMDgwY2JjLTFiOGNlZDUzLTAzMDRiZjNk'
  }
}

// Production environment
environments.production = {
  'httpPort' : 5000,
  'httpsPort' : 5001,
  'envName' : 'production',
  'hashingSecret' : '',
  'stripe' : {
    'secret' : ''
  },
  'mailgun' : {
    'domain' : '',
    'secret' : ''
  }
}

// Determine which environment was passed as a command-line argument
const currentEnvironment = typeof process.env.NODE_ENV == 'string' ? process.env.NODE_ENV.toLowerCase() : ''

// Check that the current environment is one of the environments above, if not default to staging
const environmentToExport = typeof environments[currentEnvironment] == 'object' ? environments[currentEnvironment] : environments.staging

// Export the module
module.exports = environmentToExport
