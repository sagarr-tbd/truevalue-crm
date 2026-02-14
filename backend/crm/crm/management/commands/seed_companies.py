"""
Seed Companies Command

Creates sample company/account data for testing.

Usage:
    # Using docker:
    docker exec crm-backend python manage.py seed_companies --org-id <uuid> --owner-id <uuid>
    
    # Or locally:
    python manage.py seed_companies --org-id <uuid> --owner-id <uuid>
    
    # With count:
    python manage.py seed_companies --org-id <uuid> --owner-id <uuid> --count 25
"""

import random
from decimal import Decimal
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from crm.models import Company, Tag, EntityTag


# Sample data for generating realistic companies
COMPANY_NAMES = [
    ("TechVision", "Solutions"),
    ("Global", "Systems"),
    ("Innovate", "Labs"),
    ("NextGen", "Tech"),
    ("CloudFirst", "Inc"),
    ("Digital", "Dynamics"),
    ("Prime", "Industries"),
    ("Strategic", "Partners"),
    ("Apex", "Consulting"),
    ("Quantum", "Software"),
    ("Pinnacle", "Group"),
    ("Horizon", "Technologies"),
    ("Vertex", "Corp"),
    ("Atlas", "Enterprises"),
    ("Stellar", "Solutions"),
    ("Fusion", "Labs"),
    ("Momentum", "Systems"),
    ("Catalyst", "Digital"),
    ("Summit", "Innovations"),
    ("Synergy", "Tech"),
    ("Pioneer", "Networks"),
    ("Elevation", "Software"),
    ("Vantage", "Analytics"),
    ("Keystone", "Services"),
    ("Benchmark", "Solutions"),
    ("Paradigm", "Group"),
    ("Cornerstone", "Tech"),
    ("Velocity", "Systems"),
    ("Ascent", "Digital"),
    ("Nexus", "Innovations"),
]

INDUSTRIES = [
    "Technology",
    "Healthcare",
    "Finance",
    "Retail",
    "Manufacturing",
    "Education",
    "Real Estate",
    "Consulting",
    "Software",
    "IT Services",
    "Marketing",
    "Telecommunications",
    "Energy",
    "Logistics",
    "Media",
]

SIZES = ["1", "2-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]
SIZE_WEIGHTS = [5, 15, 25, 25, 15, 10, 5]  # Distribution weights

CITIES = [
    ("San Francisco", "California", "USA"),
    ("New York", "New York", "USA"),
    ("Austin", "Texas", "USA"),
    ("Seattle", "Washington", "USA"),
    ("Boston", "Massachusetts", "USA"),
    ("Chicago", "Illinois", "USA"),
    ("Denver", "Colorado", "USA"),
    ("Miami", "Florida", "USA"),
    ("Atlanta", "Georgia", "USA"),
    ("Los Angeles", "California", "USA"),
    ("Phoenix", "Arizona", "USA"),
    ("Portland", "Oregon", "USA"),
    ("Mumbai", "Maharashtra", "India"),
    ("Bangalore", "Karnataka", "India"),
    ("Delhi", "Delhi", "India"),
    ("London", "", "UK"),
    ("Toronto", "Ontario", "Canada"),
    ("Sydney", "NSW", "Australia"),
    ("Berlin", "", "Germany"),
    ("Singapore", "", "Singapore"),
]

STREET_NAMES = [
    "Main Street", "Oak Avenue", "Tech Park Drive", "Innovation Blvd",
    "Business Center Road", "Corporate Plaza", "Commerce Way",
    "Enterprise Lane", "Market Street", "Trade Center Road",
]

DESCRIPTIONS = [
    "Leading provider of innovative solutions in the {industry} sector.",
    "A growing company specializing in {industry} services and consulting.",
    "Established player in the {industry} market with a focus on quality.",
    "Dynamic organization delivering cutting-edge {industry} solutions.",
    "Trusted partner for businesses seeking {industry} expertise.",
    "Fast-growing startup disrupting the {industry} landscape.",
    "Enterprise-grade solutions for the {industry} industry.",
    "Boutique firm specializing in niche {industry} services.",
]


def generate_email(company_name: str) -> str:
    """Generate a company email from the name."""
    clean_name = company_name.lower().replace(" ", "").replace(",", "").replace(".", "")
    domains = ["com", "io", "co", "tech", "solutions"]
    return f"info@{clean_name}.{random.choice(domains)}"


def generate_phone(country: str) -> str:
    """Generate a phone number based on country."""
    if country == "USA":
        area_code = random.choice(["555", "415", "212", "512", "206", "617", "303", "305"])
        return f"+1 ({area_code}) {random.randint(100, 999)}-{random.randint(1000, 9999)}"
    elif country == "India":
        return f"+91-{random.randint(70, 99)}-{random.randint(10000000, 99999999)}"
    elif country == "UK":
        return f"+44 20 {random.randint(1000, 9999)} {random.randint(1000, 9999)}"
    elif country == "Canada":
        return f"+1 ({random.randint(200, 999)}) {random.randint(100, 999)}-{random.randint(1000, 9999)}"
    elif country == "Australia":
        return f"+61 2 {random.randint(1000, 9999)} {random.randint(1000, 9999)}"
    elif country == "Germany":
        return f"+49 30 {random.randint(10000000, 99999999)}"
    elif country == "Singapore":
        return f"+65 {random.randint(6000, 9999)} {random.randint(1000, 9999)}"
    else:
        return f"+1 (555) {random.randint(100, 999)}-{random.randint(1000, 9999)}"


def generate_website(company_name: str) -> str:
    """Generate a website URL from company name."""
    clean_name = company_name.lower().replace(" ", "").replace(",", "").replace(".", "")
    domains = ["com", "io", "co", "tech"]
    return f"https://www.{clean_name}.{random.choice(domains)}"


def generate_employee_count(size: str) -> int:
    """Generate employee count based on size category."""
    size_ranges = {
        "1": (1, 1),
        "2-10": (2, 10),
        "11-50": (11, 50),
        "51-200": (51, 200),
        "201-500": (201, 500),
        "501-1000": (501, 1000),
        "1000+": (1001, 15000),
    }
    min_emp, max_emp = size_ranges.get(size, (10, 100))
    return random.randint(min_emp, max_emp)


def generate_revenue(employee_count: int) -> Decimal:
    """Generate annual revenue based on employee count."""
    # Rough revenue per employee: $50K - $200K
    revenue_per_emp = random.randint(50000, 200000)
    revenue = employee_count * revenue_per_emp
    # Round to nearest 10K
    revenue = round(revenue / 10000) * 10000
    return Decimal(str(revenue))


class Command(BaseCommand):
    help = 'Seed sample company data for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--org-id',
            type=str,
            required=True,
            help='Organization UUID',
        )
        parser.add_argument(
            '--owner-id',
            type=str,
            required=True,
            help='Owner (user) UUID for the companies',
        )
        parser.add_argument(
            '--count',
            type=int,
            default=25,
            help='Number of companies to create (default: 25)',
        )
        parser.add_argument(
            '--clear-existing',
            action='store_true',
            help='Clear existing companies before seeding',
        )

    def handle(self, *args, **options):
        org_id = options['org_id']
        owner_id = options['owner_id']
        count = options['count']
        clear_existing = options['clear_existing']

        self.stdout.write(f"Seeding {count} companies for org: {org_id}")

        try:
            with transaction.atomic():
                # Clear existing if requested
                if clear_existing:
                    deleted_count = Company.objects.filter(org_id=org_id).delete()[0]
                    self.stdout.write(f"  Cleared {deleted_count} existing companies")

                # Fetch existing tags for the org (if any)
                existing_tags = list(Tag.objects.filter(
                    org_id=org_id,
                    entity_type__in=['company', 'all']
                ))

                # Create companies
                companies_created = []
                used_names = set()

                for i in range(count):
                    # Generate unique company name
                    while True:
                        name_parts = random.choice(COMPANY_NAMES)
                        company_name = f"{name_parts[0]} {name_parts[1]}"
                        if company_name not in used_names:
                            used_names.add(company_name)
                            break

                    # Generate company data
                    industry = random.choice(INDUSTRIES)
                    size = random.choices(SIZES, weights=SIZE_WEIGHTS)[0]
                    city, state, country = random.choice(CITIES)
                    employee_count = generate_employee_count(size)
                    annual_revenue = generate_revenue(employee_count)

                    company = Company.objects.create(
                        org_id=org_id,
                        owner_id=owner_id,
                        name=company_name,
                        industry=industry,
                        size=size,
                        website=generate_website(company_name),
                        email=generate_email(company_name),
                        phone=generate_phone(country),
                        address_line1=f"{random.randint(1, 999)} {random.choice(STREET_NAMES)}",
                        address_line2=f"Suite {random.randint(100, 999)}" if random.random() > 0.5 else None,
                        city=city,
                        state=state,
                        country=country,
                        postal_code=str(random.randint(10000, 99999)),
                        employee_count=employee_count,
                        annual_revenue=annual_revenue,
                        description=random.choice(DESCRIPTIONS).format(industry=industry.lower()),
                        linkedin_url=f"https://linkedin.com/company/{company_name.lower().replace(' ', '-')}" if random.random() > 0.3 else None,
                        twitter_url=f"https://twitter.com/{company_name.lower().replace(' ', '')}" if random.random() > 0.5 else None,
                        facebook_url=f"https://facebook.com/{company_name.lower().replace(' ', '')}" if random.random() > 0.6 else None,
                    )

                    # Assign random tags (if available)
                    if existing_tags and random.random() > 0.4:
                        num_tags = random.randint(1, min(3, len(existing_tags)))
                        selected_tags = random.sample(existing_tags, num_tags)
                        for tag in selected_tags:
                            EntityTag.objects.create(
                                tag=tag,
                                entity_type='company',
                                entity_id=company.id,
                                company=company,
                            )

                    companies_created.append(company)
                    self.stdout.write(f"  Created: {company.name} ({industry}, {size} employees)")

                self.stdout.write(
                    self.style.SUCCESS(f"\nSuccessfully created {len(companies_created)} companies!")
                )

                # Summary by industry
                self.stdout.write("\nSummary by industry:")
                industry_counts = {}
                for c in companies_created:
                    industry_counts[c.industry] = industry_counts.get(c.industry, 0) + 1
                for industry, cnt in sorted(industry_counts.items(), key=lambda x: -x[1]):
                    self.stdout.write(f"  {industry}: {cnt}")

                # Summary by size
                self.stdout.write("\nSummary by size:")
                size_counts = {}
                for c in companies_created:
                    size_counts[c.size] = size_counts.get(c.size, 0) + 1
                for size in SIZES:
                    cnt = size_counts.get(size, 0)
                    if cnt > 0:
                        self.stdout.write(f"  {size}: {cnt}")

        except Exception as e:
            raise CommandError(f"Error seeding companies: {e}")
