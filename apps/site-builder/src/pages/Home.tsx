import { } from 'react' // React import for JSX
import { Link } from 'react-router-dom'
import { PencilSquareIcon, DocumentTextIcon, RocketLaunchIcon, GlobeAltIcon } from '@heroicons/react/24/outline'

const features = [
  {
    name: 'Template-Based Design',
    description: 'Choose from professional templates for personal, portfolio, blog, or business sites.',
    icon: PencilSquareIcon
  },
  {
    name: 'ENS Integration', 
    description: 'Your ENS name becomes your website URL. yourname.eth points directly to your site.',
    icon: GlobeAltIcon
  },
  {
    name: 'Walrus Storage',
    description: 'Decentralized, censorship-resistant hosting on the Walrus network.',
    icon: DocumentTextIcon
  },
  {
    name: 'One-Click Deploy',
    description: 'Deploy complete websites with assets, routing, and SEO optimization.',
    icon: RocketLaunchIcon
  }
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              WalrENS
            </h1>
            <div className="flex space-x-4">
              <Link
                to="/dashboard"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium"
              >
                Dashboard
              </Link>
              <Link
                to="/builder"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Create Site
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              ENS-Powered 
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-400">
                Walrus Sites
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Transform your ENS name into a decentralized website. 
              Deploy React apps, blogs, portfolios, and more to Walrus Sites with permanent, censorship-resistant hosting.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/builder"
                className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition-colors flex items-center justify-center"
              >
                <PencilSquareIcon className="w-5 h-5 mr-2" />
                Start Building
              </Link>
              <Link
                to="/dashboard"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-bold py-3 px-8 rounded-lg transition-colors flex items-center justify-center"
              >
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Professional website creation meets decentralized hosting. 
              Build, deploy, and manage websites with your ENS identity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.name} className="text-center p-6">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Deploy your decentralized website in four simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Choose Template', desc: 'Select from professional templates' },
              { step: '2', title: 'Upload Files', desc: 'Add your HTML, CSS, JS, and assets' }, 
              { step: '3', title: 'Preview Site', desc: 'Test your site across devices' },
              { step: '4', title: 'Deploy & Link', desc: 'Deploy to Walrus and link to ENS' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Build Your Decentralized Website?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join the decentralized web revolution. Transform your ENS name into a powerful website today.
          </p>
          <Link
            to="/builder"
            className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition-colors inline-flex items-center"
          >
            <RocketLaunchIcon className="w-5 h-5 mr-2" />
            Get Started Now
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 WalrENS. Powered by ENS and Walrus Sites.</p>
        </div>
      </div>
    </div>
  )
}
