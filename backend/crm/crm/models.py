"""
CRM Service Models.

Phase 1 (MVP):
- Contact, Company, ContactCompany (linking)
- Lead, LeadSource
- Deal, Pipeline, PipelineStage
- Activity (Task, Note, Call, Email, Meeting)
- Tag, EntityTag
- CustomFieldDefinition, CustomFieldValue

Designed for Phase 2+:
- Products, Quotes (via Deal.line_items JSON initially)
- Cases/Tickets (new model)
- Email sync (EmailMessage model)
- Workflows (new service or module)

Multi-tenant: All entities are org-scoped via org_id.
"""
import uuid
from decimal import Decimal
from django.db import models
from django.db.models.functions import Upper
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.operations import TrigramExtension
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator


# =============================================================================
# ABSTRACT BASE MODELS
# =============================================================================

class SoftDeleteManager(models.Manager):
    """
    Manager that excludes soft-deleted records by default.
    
    Use `.all_with_deleted()` to include deleted records.
    Use `.deleted_only()` to get only deleted records.
    """
    
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)
    
    def all_with_deleted(self):
        """Return all records including soft-deleted ones."""
        return super().get_queryset()
    
    def deleted_only(self):
        """Return only soft-deleted records."""
        return super().get_queryset().filter(deleted_at__isnull=False)


class BaseModel(models.Model):
    """Abstract base model with common fields."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True


class SoftDeleteModel(BaseModel):
    """
    Abstract model with soft delete support.
    
    Instead of permanently deleting records, sets `deleted_at` timestamp.
    Use `hard_delete()` for permanent deletion.
    """
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    deleted_by = models.UUIDField(null=True, blank=True)  # User who deleted
    
    # Default manager excludes deleted records
    objects = SoftDeleteManager()
    
    # Manager to access all records including deleted
    all_objects = models.Manager()
    
    class Meta:
        abstract = True
    
    @property
    def is_deleted(self) -> bool:
        """Check if record is soft-deleted."""
        return self.deleted_at is not None
    
    def soft_delete(self, deleted_by: uuid.UUID = None):
        """
        Soft delete this record.
        
        Args:
            deleted_by: UUID of user performing the deletion
        """
        self.deleted_at = timezone.now()
        self.deleted_by = deleted_by
        self.save(update_fields=['deleted_at', 'deleted_by', 'updated_at'])
    
    def restore(self):
        """Restore a soft-deleted record."""
        self.deleted_at = None
        self.deleted_by = None
        self.save(update_fields=['deleted_at', 'deleted_by', 'updated_at'])
    
    def hard_delete(self):
        """Permanently delete this record."""
        super().delete()


class OrgScopedModel(BaseModel):
    """Abstract model for org-scoped entities."""
    org_id = models.UUIDField(db_index=True)
    
    class Meta:
        abstract = True


class OwnedModel(OrgScopedModel):
    """Abstract model for entities with ownership."""
    owner_id = models.UUIDField(db_index=True)  # User ID from Auth Service
    
    class Meta:
        abstract = True


class SoftDeleteOwnedModel(SoftDeleteModel):
    """
    Abstract model for owned entities with soft delete support.
    
    Use this for entities that should support soft delete (Contact, Lead, Deal, etc.)
    """
    org_id = models.UUIDField(db_index=True)
    owner_id = models.UUIDField(db_index=True)
    
    class Meta:
        abstract = True


# =============================================================================
# CUSTOM FIELDS (for extensibility)
# =============================================================================

class CustomFieldDefinition(OrgScopedModel):
    """
    Definition of a custom field for an entity type.
    
    Allows users to extend Contact, Company, Deal, Lead with custom fields.
    Phase 1: Basic types (text, number, date, select, multi-select)
    Phase 3: Calculated fields, conditional fields
    """
    
    class EntityType(models.TextChoices):
        CONTACT = 'contact', 'Contact'
        COMPANY = 'company', 'Company'
        DEAL = 'deal', 'Deal'
        LEAD = 'lead', 'Lead'
    
    class FieldType(models.TextChoices):
        TEXT = 'text', 'Text'
        TEXTAREA = 'textarea', 'Text Area'
        NUMBER = 'number', 'Number'
        DECIMAL = 'decimal', 'Decimal'
        DATE = 'date', 'Date'
        DATETIME = 'datetime', 'Date & Time'
        CHECKBOX = 'checkbox', 'Checkbox'
        SELECT = 'select', 'Dropdown'
        MULTI_SELECT = 'multi_select', 'Multi-Select'
        EMAIL = 'email', 'Email'
        PHONE = 'phone', 'Phone'
        URL = 'url', 'URL'
        # Phase 3:
        # FORMULA = 'formula', 'Formula'
        # LOOKUP = 'lookup', 'Lookup'
    
    entity_type = models.CharField(max_length=20, choices=EntityType.choices, db_index=True)
    name = models.CharField(max_length=100)
    label = models.CharField(max_length=100)
    field_type = models.CharField(max_length=20, choices=FieldType.choices)
    
    # Field options
    is_required = models.BooleanField(default=False)
    is_unique = models.BooleanField(default=False)
    default_value = models.TextField(null=True, blank=True)
    placeholder = models.CharField(max_length=200, null=True, blank=True)
    help_text = models.CharField(max_length=500, null=True, blank=True)
    
    # For select/multi-select fields
    options = models.JSONField(default=list, blank=True)
    # [{"value": "option1", "label": "Option 1", "color": "#ff0000"}, ...]
    
    # Validation rules
    validation = models.JSONField(default=dict, blank=True)
    # {"min": 0, "max": 100, "pattern": "^[A-Z]+$", "min_length": 5, ...}
    
    # Display order
    order = models.PositiveIntegerField(default=0)
    
    # Active/inactive
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'crm_custom_field_definitions'
        unique_together = ['org_id', 'entity_type', 'name']
        ordering = ['entity_type', 'order', 'name']
        indexes = [
            models.Index(fields=['org_id', 'entity_type']),
            models.Index(fields=['org_id', 'entity_type', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.entity_type}.{self.name}"


# =============================================================================
# TAGS
# =============================================================================

class Tag(OrgScopedModel):
    """
    Tags for categorizing entities.
    
    Can be applied to Contacts, Companies, Deals, Leads.
    """
    
    class EntityType(models.TextChoices):
        CONTACT = 'contact', 'Contact'
        COMPANY = 'company', 'Company'
        DEAL = 'deal', 'Deal'
        LEAD = 'lead', 'Lead'
        ALL = 'all', 'All'  # Tag can be used on any entity
    
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#6B7280')  # Hex color
    entity_type = models.CharField(
        max_length=20, 
        choices=EntityType.choices, 
        default=EntityType.ALL
    )
    description = models.CharField(max_length=200, null=True, blank=True)
    
    class Meta:
        db_table = 'crm_tags'
        unique_together = ['org_id', 'name', 'entity_type']
        ordering = ['name']
        indexes = [
            models.Index(fields=['org_id', 'entity_type']),
        ]
    
    def __str__(self):
        return self.name


# =============================================================================
# COMPANY
# =============================================================================

class Company(OwnedModel):
    """
    Company/Account entity.
    
    Represents a business organization that contacts belong to.
    """
    
    class Size(models.TextChoices):
        SOLO = '1', '1'
        MICRO = '2-10', '2-10'
        SMALL = '11-50', '11-50'
        MEDIUM = '51-200', '51-200'
        LARGE = '201-500', '201-500'
        ENTERPRISE = '501-1000', '501-1000'
        CORPORATE = '1000+', '1000+'
    
    # Basic info
    name = models.CharField(max_length=255, db_index=True)
    website = models.URLField(max_length=500, null=True, blank=True)
    industry = models.CharField(max_length=100, null=True, blank=True)
    size = models.CharField(max_length=20, choices=Size.choices, null=True, blank=True)
    
    # Contact info
    phone = models.CharField(max_length=50, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    
    # Address
    address_line1 = models.CharField(max_length=255, null=True, blank=True)
    address_line2 = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    postal_code = models.CharField(max_length=20, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    
    # Business info
    description = models.TextField(null=True, blank=True)
    annual_revenue = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal('0'))]
    )
    employee_count = models.PositiveIntegerField(null=True, blank=True)
    
    # Social
    linkedin_url = models.URLField(max_length=500, null=True, blank=True)
    twitter_url = models.URLField(max_length=500, null=True, blank=True)
    facebook_url = models.URLField(max_length=500, null=True, blank=True)
    
    # Custom fields (JSON for flexibility, Phase 1)
    custom_fields = models.JSONField(default=dict, blank=True)
    # {"field_name": "value", ...}
    
    # Tags (many-to-many via EntityTag)
    tags = models.ManyToManyField(Tag, through='EntityTag', related_name='companies')
    
    # Parent company (for subsidiaries)
    parent_company = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='subsidiaries'
    )
    
    class Meta:
        db_table = 'crm_companies'
        verbose_name_plural = 'Companies'
        indexes = [
            models.Index(fields=['org_id', 'name']),
            models.Index(fields=['org_id', 'industry']),
            models.Index(fields=['org_id', 'owner_id']),
            models.Index(fields=['org_id', 'created_at']),
            # GIN index for text search (requires pg_trgm extension)
            GinIndex(
                name='company_name_search_idx',
                fields=['name'],
                opclasses=['gin_trgm_ops'],
            ),
        ]
    
    def __str__(self):
        return self.name


# =============================================================================
# CONTACT
# =============================================================================

class Contact(SoftDeleteOwnedModel):
    """
    Contact entity with soft delete support.
    
    Represents an individual person, typically a customer or prospect.
    Can be linked to multiple companies.
    """
    
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'
        BOUNCED = 'bounced', 'Bounced'  # Email bounced
        UNSUBSCRIBED = 'unsubscribed', 'Unsubscribed'
        ARCHIVED = 'archived', 'Archived'
    
    # Name
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    
    # Contact info
    email = models.EmailField(db_index=True)
    secondary_email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    mobile = models.CharField(max_length=50, null=True, blank=True)
    
    # Job info
    title = models.CharField(max_length=100, null=True, blank=True)
    department = models.CharField(max_length=100, null=True, blank=True)
    
    # Primary company (shortcut for the main company)
    primary_company = models.ForeignKey(
        Company,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='primary_contacts'
    )
    
    # Address (personal address, may differ from company)
    address_line1 = models.CharField(max_length=255, null=True, blank=True)
    address_line2 = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    postal_code = models.CharField(max_length=20, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    
    # Profile
    description = models.TextField(null=True, blank=True)
    avatar_url = models.URLField(max_length=500, null=True, blank=True)
    
    # Social
    linkedin_url = models.URLField(max_length=500, null=True, blank=True)
    twitter_url = models.URLField(max_length=500, null=True, blank=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True
    )
    
    # Source (how did we get this contact)
    source = models.CharField(max_length=50, null=True, blank=True)
    source_detail = models.CharField(max_length=255, null=True, blank=True)
    
    # Converted from lead
    converted_from_lead_id = models.UUIDField(null=True, blank=True)
    converted_at = models.DateTimeField(null=True, blank=True)
    
    # Custom fields
    custom_fields = models.JSONField(default=dict, blank=True)
    
    # Tags
    tags = models.ManyToManyField(Tag, through='EntityTag', related_name='contacts')
    
    # Last activity tracking
    last_activity_at = models.DateTimeField(null=True, blank=True)
    last_contacted_at = models.DateTimeField(null=True, blank=True)
    
    # Communication preferences (Phase 2)
    do_not_call = models.BooleanField(default=False)
    do_not_email = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'crm_contacts'
        indexes = [
            models.Index(fields=['org_id', 'email']),
            models.Index(fields=['org_id', 'last_name', 'first_name']),
            models.Index(fields=['org_id', 'owner_id']),
            models.Index(fields=['org_id', 'status']),
            models.Index(fields=['org_id', 'primary_company']),
            models.Index(fields=['org_id', 'created_at']),
            models.Index(fields=['org_id', 'last_activity_at']),
            # GIN indexes for text search (requires pg_trgm extension)
            GinIndex(
                name='contact_name_search_idx',
                fields=['first_name', 'last_name'],
                opclasses=['gin_trgm_ops', 'gin_trgm_ops'],
            ),
            GinIndex(
                name='contact_email_search_idx',
                fields=['email'],
                opclasses=['gin_trgm_ops'],
            ),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


class ContactCompany(BaseModel):
    """
    Many-to-many relationship between Contacts and Companies.
    
    A contact can work at multiple companies (e.g., consultant, board member).
    """
    contact = models.ForeignKey(
        Contact,
        on_delete=models.CASCADE,
        related_name='company_associations'
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='contact_associations'
    )
    
    # Role at this company
    title = models.CharField(max_length=100, null=True, blank=True)
    department = models.CharField(max_length=100, null=True, blank=True)
    
    # Is this the primary company for this contact?
    is_primary = models.BooleanField(default=False)
    
    # Employment period
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'crm_contact_companies'
        unique_together = ['contact', 'company']
        indexes = [
            models.Index(fields=['contact', 'is_primary']),
            models.Index(fields=['company']),
        ]
    
    def __str__(self):
        return f"{self.contact} at {self.company}"


# =============================================================================
# ENTITY TAG (polymorphic tagging)
# =============================================================================

class EntityTag(BaseModel):
    """
    Polymorphic tag assignment.
    
    Links tags to any taggable entity (Contact, Company, Deal, Lead).
    """
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE, related_name='entity_tags')
    
    # Polymorphic reference
    entity_type = models.CharField(max_length=20)  # 'contact', 'company', 'deal', 'lead'
    entity_id = models.UUIDField()
    
    # For Django ManyToMany relations
    contact = models.ForeignKey(
        Contact, on_delete=models.CASCADE, null=True, blank=True,
        related_name='+'
    )
    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, null=True, blank=True,
        related_name='+'
    )
    deal = models.ForeignKey(
        'Deal', on_delete=models.CASCADE, null=True, blank=True,
        related_name='+'
    )
    lead = models.ForeignKey(
        'Lead', on_delete=models.CASCADE, null=True, blank=True,
        related_name='+'
    )
    
    class Meta:
        db_table = 'crm_entity_tags'
        unique_together = ['tag', 'entity_type', 'entity_id']
        indexes = [
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['tag']),
        ]
    
    def __str__(self):
        return f"{self.tag.name} on {self.entity_type}:{self.entity_id}"


# =============================================================================
# PIPELINE & STAGES
# =============================================================================

class Pipeline(OrgScopedModel):
    """
    Sales pipeline.
    
    Organizations can have multiple pipelines for different sales processes.
    E.g., "New Business", "Renewals", "Upsells"
    """
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    
    # Is this the default pipeline for new deals?
    is_default = models.BooleanField(default=False)
    
    # Is this pipeline active?
    is_active = models.BooleanField(default=True)
    
    # Currency for deals in this pipeline
    currency = models.CharField(max_length=3, default='USD')
    
    # Display order
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'crm_pipelines'
        indexes = [
            models.Index(fields=['org_id', 'is_default']),
            models.Index(fields=['org_id', 'is_active']),
        ]
        constraints = [
            # Only one default pipeline per organization
            models.UniqueConstraint(
                fields=['org_id'],
                condition=models.Q(is_default=True),
                name='unique_default_pipeline_per_org'
            ),
        ]
        ordering = ['order', 'name']
    
    def __str__(self):
        return self.name


class PipelineStage(BaseModel):
    """
    Stage within a pipeline.
    
    Deals move through stages from left to right.
    """
    pipeline = models.ForeignKey(
        Pipeline,
        on_delete=models.CASCADE,
        related_name='stages'
    )
    
    name = models.CharField(max_length=100)
    
    # Win probability at this stage (0-100)
    probability = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Display order (left to right)
    order = models.PositiveIntegerField(default=0)
    
    # Terminal stages
    is_won = models.BooleanField(default=False)
    is_lost = models.BooleanField(default=False)
    
    # Rotting period (days before deal is considered stale)
    rotting_days = models.PositiveIntegerField(null=True, blank=True)
    
    # Color for Kanban
    color = models.CharField(max_length=7, default='#6B7280')
    
    class Meta:
        db_table = 'crm_pipeline_stages'
        unique_together = ['pipeline', 'order']
        ordering = ['pipeline', 'order']
        indexes = [
            models.Index(fields=['pipeline', 'order']),
        ]
        constraints = [
            # Only one "won" stage per pipeline
            models.UniqueConstraint(
                fields=['pipeline'],
                condition=models.Q(is_won=True),
                name='unique_won_stage_per_pipeline'
            ),
            # Only one "lost" stage per pipeline
            models.UniqueConstraint(
                fields=['pipeline'],
                condition=models.Q(is_lost=True),
                name='unique_lost_stage_per_pipeline'
            ),
            # A stage cannot be both won and lost
            models.CheckConstraint(
                check=~models.Q(is_won=True, is_lost=True),
                name='stage_not_both_won_and_lost'
            ),
        ]
    
    def __str__(self):
        return f"{self.pipeline.name} - {self.name}"
    
    @property
    def is_closed(self) -> bool:
        return self.is_won or self.is_lost


# =============================================================================
# DEAL
# =============================================================================

class Deal(SoftDeleteOwnedModel):
    """
    Deal/Opportunity entity with soft delete support.
    
    Represents a sales opportunity with a value and expected close date.
    """
    
    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        WON = 'won', 'Won'
        LOST = 'lost', 'Lost'
        ABANDONED = 'abandoned', 'Abandoned'
    
    # Basic info
    name = models.CharField(max_length=255, db_index=True)
    
    # Pipeline position
    pipeline = models.ForeignKey(
        Pipeline,
        on_delete=models.PROTECT,
        related_name='deals'
    )
    stage = models.ForeignKey(
        PipelineStage,
        on_delete=models.PROTECT,
        related_name='deals'
    )
    
    # Value
    value = models.DecimalField(
        max_digits=15, decimal_places=2, default=Decimal('0'),
        validators=[MinValueValidator(Decimal('0'))]
    )
    currency = models.CharField(max_length=3, default='USD')
    
    # Probability (can override stage probability)
    probability = models.PositiveIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Dates
    expected_close_date = models.DateField(null=True, blank=True)
    actual_close_date = models.DateField(null=True, blank=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
        db_index=True
    )
    
    # Loss reason (when status=lost)
    loss_reason = models.CharField(max_length=100, null=True, blank=True)
    loss_notes = models.TextField(null=True, blank=True)
    
    # Related entities
    contact = models.ForeignKey(
        Contact,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='deals'
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='deals'
    )
    
    # Converted from lead
    converted_from_lead_id = models.UUIDField(null=True, blank=True)
    
    # Description
    description = models.TextField(null=True, blank=True)
    
    # Custom fields
    custom_fields = models.JSONField(default=dict, blank=True)
    
    # Tags
    tags = models.ManyToManyField(Tag, through='EntityTag', related_name='deals')
    
    # Phase 2: Products/Line items (stored as JSON initially)
    line_items = models.JSONField(default=list, blank=True)
    # [{"product_id": "uuid", "name": "Product", "quantity": 1, "unit_price": 100, "discount": 0}, ...]
    
    # Stage history (for analytics)
    stage_entered_at = models.DateTimeField(default=timezone.now)
    
    # Activity tracking
    last_activity_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'crm_deals'
        indexes = [
            models.Index(fields=['org_id', 'pipeline', 'stage']),
            models.Index(fields=['org_id', 'status']),
            models.Index(fields=['org_id', 'owner_id']),
            models.Index(fields=['org_id', 'expected_close_date']),
            models.Index(fields=['org_id', 'created_at']),
            models.Index(fields=['org_id', 'value']),
            models.Index(fields=['contact']),
            models.Index(fields=['company']),
            # GIN index for text search (requires pg_trgm extension)
            GinIndex(
                name='deal_name_search_idx',
                fields=['name'],
                opclasses=['gin_trgm_ops'],
            ),
        ]
        constraints = [
            # Deal value must be non-negative
            models.CheckConstraint(
                check=models.Q(value__gte=0),
                name='deal_value_non_negative'
            ),
            # Probability must be between 0 and 100
            models.CheckConstraint(
                check=(
                    models.Q(probability__isnull=True) |
                    (models.Q(probability__gte=0) & models.Q(probability__lte=100))
                ),
                name='deal_probability_valid_range'
            ),
        ]
    
    def __str__(self):
        return self.name
    
    @property
    def weighted_value(self) -> Decimal:
        """Calculate weighted value based on probability."""
        prob = self.probability if self.probability is not None else self.stage.probability
        return self.value * Decimal(prob) / Decimal(100)
    
    def move_to_stage(self, stage: PipelineStage):
        """Move deal to a new stage."""
        self.stage = stage
        self.stage_entered_at = timezone.now()
        
        # Update status based on stage
        if stage.is_won:
            self.status = self.Status.WON
            self.actual_close_date = timezone.now().date()
        elif stage.is_lost:
            self.status = self.Status.LOST
            self.actual_close_date = timezone.now().date()
        else:
            self.status = self.Status.OPEN


class DealStageHistory(BaseModel):
    """
    History of deal stage changes.
    
    Tracks when deals moved between stages for analytics.
    """
    deal = models.ForeignKey(
        Deal,
        on_delete=models.CASCADE,
        related_name='stage_history'
    )
    from_stage = models.ForeignKey(
        PipelineStage,
        on_delete=models.SET_NULL,
        null=True,
        related_name='+'
    )
    to_stage = models.ForeignKey(
        PipelineStage,
        on_delete=models.SET_NULL,
        null=True,
        related_name='+'
    )
    changed_by = models.UUIDField()  # User ID
    
    # Time in previous stage
    time_in_stage_seconds = models.PositiveIntegerField(null=True, blank=True)
    
    class Meta:
        db_table = 'crm_deal_stage_history'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['deal', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.deal.name}: {self.from_stage} → {self.to_stage}"


# =============================================================================
# LEAD
# =============================================================================

class Lead(SoftDeleteOwnedModel):
    """
    Lead entity with soft delete support.
    
    Represents an unqualified prospect that may convert to Contact + Deal.
    """
    
    class Status(models.TextChoices):
        NEW = 'new', 'New'
        CONTACTED = 'contacted', 'Contacted'
        QUALIFIED = 'qualified', 'Qualified'
        UNQUALIFIED = 'unqualified', 'Unqualified'
        CONVERTED = 'converted', 'Converted'
    
    # Person info
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(db_index=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    mobile = models.CharField(max_length=50, null=True, blank=True)
    
    # Company info (free text, not linked yet)
    company_name = models.CharField(max_length=255, null=True, blank=True)
    title = models.CharField(max_length=100, null=True, blank=True)
    website = models.URLField(max_length=500, null=True, blank=True)
    
    # Address
    address_line1 = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    postal_code = models.CharField(max_length=20, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NEW,
        db_index=True
    )
    
    # Source
    source = models.CharField(max_length=50, db_index=True)
    # website, referral, cold_call, trade_show, social_media, advertisement, partner, other
    source_detail = models.CharField(max_length=255, null=True, blank=True)
    # E.g., "Google Ads Campaign Q1", "John Smith referral"
    
    # Lead score (Phase 3: AI-based)
    score = models.PositiveIntegerField(null=True, blank=True)
    
    # Interest/needs
    description = models.TextField(null=True, blank=True)
    
    # Custom fields
    custom_fields = models.JSONField(default=dict, blank=True)
    
    # Tags
    tags = models.ManyToManyField(Tag, through='EntityTag', related_name='leads')
    
    # Conversion tracking
    converted_at = models.DateTimeField(null=True, blank=True)
    converted_contact_id = models.UUIDField(null=True, blank=True)
    converted_company_id = models.UUIDField(null=True, blank=True)
    converted_deal_id = models.UUIDField(null=True, blank=True)
    converted_by = models.UUIDField(null=True, blank=True)
    
    # Disqualification
    disqualified_reason = models.CharField(max_length=100, null=True, blank=True)
    disqualified_at = models.DateTimeField(null=True, blank=True)
    
    # Activity tracking
    last_activity_at = models.DateTimeField(null=True, blank=True)
    last_contacted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'crm_leads'
        indexes = [
            models.Index(fields=['org_id', 'email']),
            models.Index(fields=['org_id', 'status']),
            models.Index(fields=['org_id', 'source']),
            models.Index(fields=['org_id', 'owner_id']),
            models.Index(fields=['org_id', 'created_at']),
            models.Index(fields=['org_id', 'score']),
            # GIN indexes for text search (requires pg_trgm extension)
            GinIndex(
                name='lead_name_search_idx',
                fields=['first_name', 'last_name'],
                opclasses=['gin_trgm_ops', 'gin_trgm_ops'],
            ),
            GinIndex(
                name='lead_email_search_idx',
                fields=['email'],
                opclasses=['gin_trgm_ops'],
            ),
            GinIndex(
                name='lead_company_search_idx',
                fields=['company_name'],
                opclasses=['gin_trgm_ops'],
            ),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


# =============================================================================
# ACTIVITY
# =============================================================================

class Activity(OwnedModel):
    """
    Activity entity (Task, Note, Call, Email, Meeting).
    
    Tracks all interactions and to-dos related to CRM entities.
    """
    
    class ActivityType(models.TextChoices):
        TASK = 'task', 'Task'
        NOTE = 'note', 'Note'
        CALL = 'call', 'Call'
        EMAIL = 'email', 'Email'
        MEETING = 'meeting', 'Meeting'
    
    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        NORMAL = 'normal', 'Normal'
        HIGH = 'high', 'High'
        URGENT = 'urgent', 'Urgent'
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'
    
    # Activity type
    activity_type = models.CharField(
        max_length=20,
        choices=ActivityType.choices,
        db_index=True
    )
    
    # Basic info
    subject = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    
    # Status & Priority (for tasks)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.NORMAL
    )
    
    # Dates
    due_date = models.DateTimeField(null=True, blank=True, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # For meetings/calls
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    
    # Call specific
    call_direction = models.CharField(max_length=10, null=True, blank=True)  # inbound/outbound
    call_outcome = models.CharField(max_length=50, null=True, blank=True)  # answered, voicemail, no_answer
    
    # Email specific (Phase 2: full email sync)
    email_direction = models.CharField(max_length=10, null=True, blank=True)  # sent/received
    email_message_id = models.CharField(max_length=255, null=True, blank=True)
    
    # Related entities (polymorphic)
    contact = models.ForeignKey(
        Contact,
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='activities'
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='activities'
    )
    deal = models.ForeignKey(
        Deal,
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='activities'
    )
    lead = models.ForeignKey(
        Lead,
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='activities'
    )
    
    # Assigned to (may differ from owner)
    assigned_to = models.UUIDField(null=True, blank=True, db_index=True)
    
    # Reminders
    reminder_at = models.DateTimeField(null=True, blank=True)
    reminder_sent = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'crm_activities'
        verbose_name_plural = 'Activities'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['org_id', 'activity_type']),
            models.Index(fields=['org_id', 'status']),
            models.Index(fields=['org_id', 'owner_id']),
            models.Index(fields=['org_id', 'assigned_to']),
            models.Index(fields=['org_id', 'due_date']),
            models.Index(fields=['contact']),
            models.Index(fields=['company']),
            models.Index(fields=['deal']),
            models.Index(fields=['lead']),
        ]
    
    def __str__(self):
        return f"{self.activity_type}: {self.subject}"
    
    def complete(self):
        """Mark activity as completed."""
        self.status = self.Status.COMPLETED
        self.completed_at = timezone.now()


# =============================================================================
# CUSTOM FIELD VALUES
# =============================================================================

class CustomFieldValue(BaseModel):
    """
    Store custom field values for entities.
    
    Alternative to JSON custom_fields for better querying.
    Phase 2+: Consider using this for advanced filtering.
    """
    field = models.ForeignKey(
        CustomFieldDefinition,
        on_delete=models.CASCADE,
        related_name='values'
    )
    
    # Polymorphic reference
    entity_type = models.CharField(max_length=20)
    entity_id = models.UUIDField()
    
    # Value (stored as text, parsed based on field type)
    value_text = models.TextField(null=True, blank=True)
    value_number = models.DecimalField(max_digits=20, decimal_places=6, null=True, blank=True)
    value_date = models.DateTimeField(null=True, blank=True)
    value_boolean = models.BooleanField(null=True, blank=True)
    value_json = models.JSONField(null=True, blank=True)  # For multi-select
    
    class Meta:
        db_table = 'crm_custom_field_values'
        unique_together = ['field', 'entity_type', 'entity_id']
        indexes = [
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['field']),
        ]
    
    def __str__(self):
        return f"{self.field.name} for {self.entity_type}:{self.entity_id}"


# =============================================================================
# AUDIT LOG (CRM-specific)
# =============================================================================

class CRMAuditLog(BaseModel):
    """
    Audit log for CRM actions.
    
    Tracks changes to CRM entities for history and compliance.
    Also publishes to central Audit Log service via Kafka.
    """
    
    class Action(models.TextChoices):
        CREATE = 'create', 'Create'
        UPDATE = 'update', 'Update'
        DELETE = 'delete', 'Delete'
        CONVERT = 'convert', 'Convert'
        STAGE_CHANGE = 'stage_change', 'Stage Change'
        OWNER_CHANGE = 'owner_change', 'Owner Change'
        IMPORT = 'import', 'Import'
        EXPORT = 'export', 'Export'
        MERGE = 'merge', 'Merge'
    
    org_id = models.UUIDField(db_index=True)
    actor_id = models.UUIDField(db_index=True)  # User who performed action
    
    action = models.CharField(max_length=20, choices=Action.choices)
    
    # Entity reference
    entity_type = models.CharField(max_length=20)
    entity_id = models.UUIDField()
    entity_name = models.CharField(max_length=255, null=True, blank=True)  # Snapshot
    
    # Change details
    changes = models.JSONField(default=dict, blank=True)
    # {"field": {"old": "value", "new": "value"}, ...}
    
    # Request context
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, null=True, blank=True)
    
    class Meta:
        db_table = 'crm_audit_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['org_id', 'created_at']),
            models.Index(fields=['org_id', 'entity_type', 'entity_id']),
            models.Index(fields=['org_id', 'actor_id']),
            models.Index(fields=['org_id', 'action']),
        ]
    
    def __str__(self):
        return f"{self.action} {self.entity_type}:{self.entity_id} by {self.actor_id}"
