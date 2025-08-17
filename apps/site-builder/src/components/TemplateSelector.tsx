import { } from 'react'
import { UserIcon, BriefcaseIcon, DocumentTextIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'

export interface SiteTemplate {
  id: string
  name: string
  description: string
  icon: React.ComponentType<any>
  preview: string
  features: string[]
}

const templates: SiteTemplate[] = [
  {
    id: 'personal',
    name: 'Personal',
    description: 'Simple about page with links and contact info',
    icon: UserIcon,
    preview: '/templates/personal-preview.png',
    features: ['About section', 'Social links', 'Contact form', 'Responsive design']
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Showcase your work with project galleries',
    icon: BriefcaseIcon,
    preview: '/templates/portfolio-preview.png',
    features: ['Project showcase', 'Image galleries', 'Skills section', 'Resume download']
  },
  {
    id: 'blog',
    name: 'Blog',
    description: 'Multi-page blog with categories and search',
    icon: DocumentTextIcon,
    preview: '/templates/blog-preview.png',
    features: ['Article pages', 'Category system', 'Search functionality', 'RSS feed']
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Professional landing page for businesses',
    icon: BuildingOfficeIcon,
    preview: '/templates/business-preview.png',
    features: ['Service showcase', 'Team section', 'Contact forms', 'Testimonials']
  }
]

interface TemplateSelectorProps {
  selectedTemplate: string | null
  onSelectTemplate: (templateId: string) => void
}

export default function TemplateSelector({ selectedTemplate, onSelectTemplate }: TemplateSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose a Template</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Select a template that best fits your needs. You can customize it later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template) => {
          const Icon = template.icon
          const isSelected = selectedTemplate === template.id

          return (
            <div
              key={template.id}
              className={`
                relative border rounded-lg p-6 cursor-pointer transition-all
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
              onClick={() => onSelectTemplate(template.id)}
            >
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-4">
                <div className={`
                  flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center
                  ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}
                `}>
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {template.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {template.description}
                  </p>

                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Features:
                    </h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {template.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
