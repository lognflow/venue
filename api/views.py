from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Auditorium, Booking, Notification, AuditLog
from .serializers import UserSerializer, AuditoriumSerializer, BookingSerializer, NotificationSerializer, AuditLogSerializer
from django.db.models import Q

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    data = request.data
    email = data.get('email', '')
    if not email.endswith('@nie.ac.in'):
        return Response({'error': 'Only @nie.ac.in emails are allowed.'}, status=status.HTTP_400_BAD_REQUEST)
    
    serializer = UserSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AuditoriumViewSet(viewsets.ModelViewSet):
    queryset = Auditorium.objects.all()
    serializer_class = AuditoriumSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [AllowAny()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            from django.utils import timezone
            now = timezone.localtime()
            current_date = now.date()
            current_time = now.time()
            return Booking.objects.filter(
                Q(date__gt=current_date) | Q(date=current_date, end_time__gt=current_time)
            ).order_by('submitted_at')
        return Booking.objects.filter(user=self.request.user).order_by('-submitted_at')

    @action(detail=False, methods=['get'])
    def approved(self, request):
        from django.utils import timezone
        now = timezone.localtime()
        current_date = now.date()
        current_time = now.time()
        
        approved_bookings = Booking.objects.filter(
            status='approved'
        ).filter(
            Q(date__gt=current_date) | Q(date=current_date, end_time__gt=current_time)
        ).order_by('date', 'start_time')
        
        serializer = self.get_serializer(approved_bookings, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        # Check for double booking
        date = serializer.validated_data['date']
        start_time = serializer.validated_data['start_time']
        end_time = serializer.validated_data['end_time']
        auditorium = serializer.validated_data['auditorium']

        overlapping = Booking.objects.filter(
            auditorium=auditorium,
            date=date,
            status='approved',
        ).filter(
            Q(start_time__lt=end_time) & Q(end_time__gt=start_time)
        )
        if overlapping.exists():
            raise serializers.ValidationError('This auditorium is already booked for the specified time slot.')

        booking = serializer.save(user=self.request.user)

        # Notify all admins
        admins = User.objects.filter(role='admin')
        for admin in admins:
            Notification.objects.create(
                user=admin,
                booking=booking,
                message=f'New booking request from {self.request.user.username} for {auditorium.name}.'
            )

    def partial_update(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response(status=status.HTTP_403_FORBIDDEN)
        
        instance = self.get_object()
        new_status = request.data.get('status')
        if new_status in ['approved', 'rejected']:
            if new_status == 'approved':
                # Double check overlapping
                overlapping = Booking.objects.filter(
                    auditorium=instance.auditorium,
                    date=instance.date,
                    status='approved',
                ).filter(
                    Q(start_time__lt=instance.end_time) & Q(end_time__gt=instance.start_time)
                ).exclude(id=instance.id)
                if overlapping.exists():
                    # Reject automatically
                    instance.status = 'rejected'
                    instance.save()
                    Notification.objects.create(user=instance.user, booking=instance, message='Your booking request was rejected due to a time conflict.')
                    AuditLog.objects.create(admin=request.user, action='Auto-Rejected (Conflict)', target_type='Booking', target_id=instance.id)
                    return Response({'status': 'rejected', 'message': 'Booking automatically rejected due to conflict.'})

            instance.status = new_status
            instance.save()

            Notification.objects.create(
                user=instance.user,
                booking=instance,
                message=f'Your booking request has been {new_status}.'
            )
            AuditLog.objects.create(
                admin=request.user,
                action=f'{new_status.capitalize()} booking',
                target_type='Booking',
                target_id=instance.id
            )
            
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        
        return Response(status=status.HTTP_400_BAD_REQUEST)

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'success'})

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]
    queryset = AuditLog.objects.all().order_by('-performed_at')
