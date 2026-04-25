import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import User

def seed():
    if not User.objects.filter(email='admin@nie.ac.in').exists():
        User.objects.create_superuser(
            username='admin',
            email='admin@nie.ac.in',
            password='admin123',
            role='admin'
        )
        print("Superuser created.")
    else:
        print("Superuser already exists.")

if __name__ == '__main__':
    seed()
