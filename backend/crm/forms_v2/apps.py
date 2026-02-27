from django.apps import AppConfig


class FormsV2Config(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'forms_v2'
    verbose_name = 'Forms V2 (Dynamic Form System)'
    
    def ready(self):
        """
        Initialize app when Django starts.
        Import signals, register admin, etc.
        """
        pass
