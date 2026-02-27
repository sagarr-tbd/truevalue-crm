"""
Default form schemas for auto-creation.

Industry standard pattern (Zoho/HubSpot/Salesforce):
- Forms are available immediately on first access
- No manual seeding required
- Per-organization customization via UI

This module provides template schemas that are used to auto-create
default FormDefinition records when a user first accesses an entity
without an existing form.
"""


def get_default_lead_schema():
    """
    Get default lead form schema with industry-standard fields.
    
    Based on:
    - Salesforce Lead object
    - HubSpot Contact properties
    - Zoho CRM Leads module
    - V1 Lead model (for backward compatibility)
    
    Returns:
        dict: Complete form schema with sections and fields
    """
    return {
        'version': '1.0.0',
        'sections': [
            {
                'id': 'contact_info',
                'title': 'Contact Information',
                'description': 'Basic contact details',
                'columns': 2,
                'collapsible': False,
                'fields': [
                    {
                        'name': 'first_name',
                        'label': 'First Name',
                        'field_type': 'text',
                        'is_required': True,
                        'is_unique': False,
                        'is_searchable': True,
                        'placeholder': 'Enter first name',
                        'help_text': '',
                        'validation_rules': {},
                        'options': {},
                        'default_value': None,
                        'width': 'half',
                        'readonly': False,
                    },
                    {
                        'name': 'last_name',
                        'label': 'Last Name',
                        'field_type': 'text',
                        'is_required': True,
                        'is_unique': False,
                        'is_searchable': True,
                        'placeholder': 'Enter last name',
                        'help_text': '',
                        'validation_rules': {},
                        'options': {},
                        'default_value': None,
                        'width': 'half',
                        'readonly': False,
                    },
                    {
                        'name': 'email',
                        'label': 'Email',
                        'field_type': 'email',
                        'is_required': True,
                        'is_unique': True,
                        'is_searchable': True,
                        'placeholder': 'email@example.com',
                        'help_text': '',
                        'validation_rules': {},
                        'options': {},
                        'default_value': None,
                        'width': 'half',
                        'readonly': False,
                    },
                    {
                        'name': 'phone',
                        'label': 'Phone',
                        'field_type': 'phone',
                        'is_required': False,
                        'is_unique': False,
                        'is_searchable': True,
                        'placeholder': '+1 (555) 123-4567',
                        'help_text': 'Primary phone number',
                        'validation_rules': {},
                        'options': {},
                        'default_value': None,
                        'width': 'half',
                        'readonly': False,
                    },
                    {
                        'name': 'mobile',
                        'label': 'Mobile',
                        'field_type': 'phone',
                        'is_required': False,
                        'is_unique': False,
                        'is_searchable': True,
                        'placeholder': '+1 (555) 987-6543',
                        'help_text': 'Mobile phone number',
                        'validation_rules': {},
                        'options': {},
                        'default_value': None,
                        'width': 'half',
                        'readonly': False,
                    },
                    {
                        'name': 'website',
                        'label': 'Website',
                        'field_type': 'url',
                        'is_required': False,
                        'is_unique': False,
                        'is_searchable': True,
                        'placeholder': 'https://example.com',
                        'help_text': 'Company or personal website',
                        'validation_rules': {},
                        'options': {},
                        'default_value': None,
                        'width': 'half',
                        'readonly': False,
                    },
                ]
            },
            {
                'id': 'company_info',
                'title': 'Company Information',
                'columns': 2,
                'collapsible': False,
                'fields': [
                    {
                        'name': 'company',
                        'label': 'Company',
                        'field_type': 'lookup',
                        'is_required': False,
                        'is_unique': False,
                        'is_searchable': True,
                        'placeholder': 'Select or search company',
                        'help_text': 'Link to existing company record',
                        'validation_rules': {},
                        'options': {
                            'entity': 'company',
                            'api_endpoint': '/crm/api/v2/forms/definitions/lookup-options/?entity=company',
                            'display_field': 'label',
                            'value_field': 'id',
                            'searchable': True,
                            'allow_create': True,
                        },
                        'default_value': None,
                        'width': 'half',
                        'readonly': False,
                    },
                    {
                        'name': 'company_name',
                        'label': 'Company Name',
                        'field_type': 'text',
                        'is_required': False,
                        'is_unique': False,
                        'is_searchable': True,
                        'placeholder': 'Company name',
                        'help_text': 'Company name (free text)',
                        'validation_rules': {},
                        'options': {},
                        'default_value': None,
                        'width': 'half',
                        'readonly': False,
                    },
                    {
                        'name': 'title',
                        'label': 'Job Title',
                        'field_type': 'text',
                        'is_required': False,
                        'is_unique': False,
                        'is_searchable': True,
                        'placeholder': 'e.g., Sales Manager',
                        'help_text': '',
                        'validation_rules': {},
                        'options': {},
                        'default_value': None,
                        'width': 'half',
                        'readonly': False,
                    },
                    {
                        'name': 'industry',
                        'label': 'Industry',
                        'field_type': 'select',
                        'is_required': False,
                        'is_unique': False,
                        'is_searchable': True,
                        'placeholder': 'Select industry',
                        'help_text': '',
                        'validation_rules': {},
                        'options': {
                            'options': [
                                {'value': 'technology', 'label': 'Technology'},
                                {'value': 'finance', 'label': 'Finance & Banking'},
                                {'value': 'healthcare', 'label': 'Healthcare'},
                                {'value': 'retail', 'label': 'Retail & E-commerce'},
                                {'value': 'manufacturing', 'label': 'Manufacturing'},
                                {'value': 'real_estate', 'label': 'Real Estate'},
                                {'value': 'education', 'label': 'Education'},
                                {'value': 'consulting', 'label': 'Consulting'},
                                {'value': 'other', 'label': 'Other'},
                            ]
                        },
                        'default_value': None,
                        'width': 'half',
                        'readonly': False,
                    },
                    {
                        'name': 'annual_revenue',
                        'label': 'Annual Revenue',
                        'field_type': 'currency',
                        'is_required': False,
                        'is_unique': False,
                        'is_searchable': False,
                        'placeholder': '0.00',
                        'help_text': 'Company annual revenue',
                        'validation_rules': {},
                        'options': {},
                        'default_value': None,
                        'width': 'half',
                        'readonly': False,
                    },
                    {
                        'name': 'employees',
                        'label': 'Number of Employees',
                        'field_type': 'select',
                        'is_required': False,
                        'is_unique': False,
                        'is_searchable': False,
                        'placeholder': 'Select size',
                        'help_text': '',
                        'validation_rules': {},
                        'options': {
                            'options': [
                                {'value': '1', 'label': '1'},
                                {'value': '2-10', 'label': '2-10'},
                                {'value': '11-50', 'label': '11-50'},
                                {'value': '51-200', 'label': '51-200'},
                                {'value': '201-500', 'label': '201-500'},
                                {'value': '501-1000', 'label': '501-1000'},
                                {'value': '1000+', 'label': '1000+'},
                            ]
                        },
                        'default_value': None,
                        'width': 'half',
                        'readonly': False,
                    },
                ]
            },
            {
                'id': 'address',
                'title': 'Address Information',
                'columns': 2,
                'collapsible': True,
                'fields': [
                    {
                        'name': 'address_line1',
                        'label': 'Street Address',
                        'field_type': 'text',
                        'is_required': False,
                        'is_unique': False,
                        'is_searchable': True,
                        'placeholder': '123 Main Street',
                        'help_text': '',
                        'validation_rules': {},
                        'options': {},
                        'default_value': None,
                        'width': 'full',
                        'readonly': False,
                    },
                    {
                        'name': 'city',
                        'label': 'City',
                        'field_type': 'text',
                        'is_required': False,
                        'is_unique': False,
                        'is_searchable': True,
                        'placeholder': 'San Francisco',
                        'help_text': '',
                        'validation_rules': {},
                        'options': {},
                        'default_value': None,
                        'width': 'half',
                        'readonly': False,
                    },
                    {
                        'name': 'state',
                        'label': 'State/Province',
                        'field_type': 'text',
                        'is_required': False,
                        'is_unique': False,
                        'is_searchable': True,
                        'placeholder': 'CA',
                        'help_text': '',
                        'validation_rules': {},
                        'options': {},
                        'default_value': None,
                        'width': 'half',
                        'readonly': False,
                    },
                    {
                        'name': 'postal_code',
                        'label': 'Zip/Postal Code',
                        'field_type': 'text',
                        'is_required': False,
                        'is_unique': False,
                        'is_searchable': True,
                        'placeholder': '94102',
                        'help_text': '',
                        'validation_rules': {},
                        'options': {},
                        'default_value': None,
                        'width': 'half',
                        'readonly': False,
                    },
                    {
                        'name': 'country',
                        'label': 'Country',
                        'field_type': 'text',
                        'is_required': False,
                        'is_unique': False,
                        'is_searchable': True,
                        'placeholder': 'United States',
                        'help_text': '',
                        'validation_rules': {},
                        'options': {},
                        'default_value': None,
                        'width': 'half',
                        'readonly': False,
                    },
                ]
            },
            {
                'id': 'qualification',
                'title': 'Lead Qualification',
                'columns': 2,
                'collapsible': False,
                'fields': [
                    {
                        'name': 'assigned_to',
                        'label': 'Assigned To',
                        'field_type': 'lookup',
                        'is_required': False,
                        'is_unique': False,
                        'is_searchable': True,
                        'placeholder': 'Select user',
                        'help_text': 'Sales rep responsible for this lead',
                        'validation_rules': {},
                        'options': {
                            'entity': 'user',
                            'api_endpoint': '/org/api/v1/orgs/__ORG_ID__/members?page_size=100&status=active',
                            'display_field': 'display_name',
                            'value_field': 'user_id',
                            'searchable': True,
                            'data_path': 'members',
                        },
                        'default_value': None,
                        'width': 'half',
                        'readonly': False,
                    },
                    {
                        'name': 'status',
                        'label': 'Status',
                        'field_type': 'select',
                        'is_required': True,
                        'is_unique': False,
                        'is_searchable': True,
                        'placeholder': '',
                        'help_text': 'Current stage of lead',
                        'validation_rules': {},
                        'options': {
                            'options': [
                                {'value': 'new', 'label': 'New', 'color': '#3b82f6'},
                                {'value': 'contacted', 'label': 'Contacted', 'color': '#8b5cf6'},
                                {'value': 'qualified', 'label': 'Qualified', 'color': '#10b981'},
                                {'value': 'unqualified', 'label': 'Unqualified', 'color': '#ef4444'},
                                {'value': 'converted', 'label': 'Converted', 'color': '#22c55e'},
                            ]
                        },
                        'default_value': 'new',
                        'width': 'half',
                        'readonly': False,
                    },
                    {
                        'name': 'source',
                        'label': 'Lead Source',
                        'field_type': 'select',
                        'is_required': False,
                        'is_unique': False,
                        'is_searchable': True,
                        'placeholder': 'Select source',
                        'help_text': 'How did we get this lead?',
                        'validation_rules': {},
                        'options': {
                            'options': [
                                {'value': 'website', 'label': 'Website'},
                                {'value': 'referral', 'label': 'Referral'},
                                {'value': 'cold_call', 'label': 'Cold Call'},
                                {'value': 'trade_show', 'label': 'Trade Show'},
                                {'value': 'social_media', 'label': 'Social Media'},
                                {'value': 'advertisement', 'label': 'Advertisement'},
                                {'value': 'partner', 'label': 'Partner'},
                                {'value': 'webinar', 'label': 'Webinar'},
                                {'value': 'email_campaign', 'label': 'Email Campaign'},
                                {'value': 'other', 'label': 'Other'},
                            ]
                        },
                        'default_value': None,
                        'width': 'half',
                        'readonly': False,
                    },
                    {
                        'name': 'source_detail',
                        'label': 'Source Details',
                        'field_type': 'text',
                        'is_required': False,
                        'is_unique': False,
                        'is_searchable': True,
                        'placeholder': 'e.g., Google Ads Q1 Campaign',
                        'help_text': 'Specific campaign or referrer',
                        'validation_rules': {},
                        'options': {},
                        'default_value': None,
                        'width': 'half',
                        'readonly': False,
                    },
                    {
                        'name': 'rating',
                        'label': 'Lead Rating',
                        'field_type': 'select',
                        'is_required': False,
                        'is_unique': False,
                        'is_searchable': True,
                        'placeholder': 'Select rating',
                        'help_text': 'Priority level of this lead',
                        'validation_rules': {},
                        'options': {
                            'options': [
                                {'value': 'hot', 'label': 'Hot', 'color': '#ef4444'},
                                {'value': 'warm', 'label': 'Warm', 'color': '#f59e0b'},
                                {'value': 'cold', 'label': 'Cold', 'color': '#3b82f6'},
                            ]
                        },
                        'default_value': None,
                        'width': 'half',
                        'readonly': False,
                    },
                    {
                        'name': 'lead_score',
                        'label': 'Lead Score',
                        'field_type': 'number',
                        'is_required': False,
                        'is_unique': False,
                        'is_searchable': False,
                        'placeholder': '0-100',
                        'help_text': 'Calculated lead score (0-100)',
                        'validation_rules': {'min': 0, 'max': 100},
                        'options': {},
                        'default_value': None,
                        'width': 'half',
                        'readonly': False,
                    },
                ]
            },
            {
                'id': 'additional',
                'title': 'Additional Information',
                'columns': 1,
                'collapsible': True,
                'fields': [
                    {
                        'name': 'description',
                        'label': 'Notes',
                        'field_type': 'textarea',
                        'is_required': False,
                        'is_unique': False,
                        'is_searchable': True,
                        'placeholder': 'Add notes about this lead...',
                        'help_text': 'Any additional information about the lead',
                        'validation_rules': {},
                        'options': {},
                        'default_value': None,
                        'width': 'full',
                        'readonly': False,
                    },
                ]
            }
        ]
    }


def get_default_contact_schema():
    """
    Get default contact form schema.
    
    Returns:
        dict: Complete form schema for contacts
    """
    return {
        'version': '1.0.0',
        'sections': [
            {
                'id': 'basic_info',
                'title': 'Basic Information',
                'columns': 2,
                'collapsible': False,
                'fields': [
                    {
                        'name': 'first_name',
                        'label': 'First Name',
                        'field_type': 'text',
                        'is_required': True,
                        'is_unique': False,
                        'is_searchable': True,
                        'placeholder': 'Enter first name',
                        'width': 'half',
                    },
                    {
                        'name': 'last_name',
                        'label': 'Last Name',
                        'field_type': 'text',
                        'is_required': True,
                        'is_unique': False,
                        'is_searchable': True,
                        'placeholder': 'Enter last name',
                        'width': 'half',
                    },
                    {
                        'name': 'email',
                        'label': 'Email',
                        'field_type': 'email',
                        'is_required': True,
                        'is_unique': True,
                        'is_searchable': True,
                        'placeholder': 'email@example.com',
                        'width': 'half',
                    },
                    {
                        'name': 'phone',
                        'label': 'Phone',
                        'field_type': 'phone',
                        'is_required': False,
                        'is_searchable': True,
                        'placeholder': '+1 (555) 123-4567',
                        'width': 'half',
                    },
                ]
            }
        ]
    }


def get_default_company_schema():
    """
    Get default company form schema.
    
    Returns:
        dict: Complete form schema for companies
    """
    return {
        'version': '1.0.0',
        'sections': [
            {
                'id': 'company_details',
                'title': 'Company Details',
                'columns': 2,
                'collapsible': False,
                'fields': [
                    {
                        'name': 'name',
                        'label': 'Company Name',
                        'field_type': 'text',
                        'is_required': True,
                        'is_unique': True,
                        'is_searchable': True,
                        'placeholder': 'Enter company name',
                        'width': 'half',
                    },
                    {
                        'name': 'website',
                        'label': 'Website',
                        'field_type': 'url',
                        'is_required': False,
                        'is_searchable': True,
                        'placeholder': 'https://example.com',
                        'width': 'half',
                    },
                    {
                        'name': 'industry',
                        'label': 'Industry',
                        'field_type': 'select',
                        'is_required': False,
                        'is_searchable': True,
                        'options': {
                            'options': [
                                {'value': 'technology', 'label': 'Technology'},
                                {'value': 'finance', 'label': 'Finance'},
                                {'value': 'healthcare', 'label': 'Healthcare'},
                                {'value': 'retail', 'label': 'Retail'},
                                {'value': 'manufacturing', 'label': 'Manufacturing'},
                                {'value': 'other', 'label': 'Other'},
                            ]
                        },
                        'width': 'half',
                    },
                    {
                        'name': 'employees',
                        'label': 'Number of Employees',
                        'field_type': 'number',
                        'is_required': False,
                        'placeholder': '0',
                        'width': 'half',
                    },
                ]
            }
        ]
    }


def get_default_deal_schema():
    """
    Get default deal form schema.
    
    Returns:
        dict: Complete form schema for deals
    """
    return {
        'version': '1.0.0',
        'sections': [
            {
                'id': 'deal_info',
                'title': 'Deal Information',
                'columns': 2,
                'collapsible': False,
                'fields': [
                    {
                        'name': 'name',
                        'label': 'Deal Name',
                        'field_type': 'text',
                        'is_required': True,
                        'is_searchable': True,
                        'placeholder': 'Enter deal name',
                        'width': 'full',
                    },
                    {
                        'name': 'value',
                        'label': 'Deal Value',
                        'field_type': 'currency',
                        'is_required': True,
                        'placeholder': '0.00',
                        'width': 'half',
                    },
                    {
                        'name': 'stage',
                        'label': 'Stage',
                        'field_type': 'select',
                        'is_required': True,
                        'is_searchable': True,
                        'options': {
                            'options': [
                                {'value': 'prospecting', 'label': 'Prospecting'},
                                {'value': 'qualification', 'label': 'Qualification'},
                                {'value': 'proposal', 'label': 'Proposal'},
                                {'value': 'negotiation', 'label': 'Negotiation'},
                                {'value': 'closed_won', 'label': 'Closed Won'},
                                {'value': 'closed_lost', 'label': 'Closed Lost'},
                            ]
                        },
                        'default_value': 'prospecting',
                        'width': 'half',
                    },
                ]
            }
        ]
    }
