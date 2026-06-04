from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("signals", "0029_wipe_legacy_scout_configs"),
    ]

    operations = [
        migrations.AddField(
            model_name="signalteamconfig",
            name="autostart_base_branches",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
