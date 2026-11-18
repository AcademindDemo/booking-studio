---
name: daily-check
description: Read-only daily check of one day's Stillwater Yoga House classes, written to reports/YYYY-MM-DD.md. Use when asked for the daily check or run as /daily-check [YYYY-MM-DD].
argument-hint: '[YYYY-MM-DD]'
---

# Daily check

Date: `$ARGUMENTS` if given, else today's date as your context states it. Use only the booking tools and the report write: no shell, not even for the date.

1. Work out that date's weekday yourself. Call `list_classes` and keep the classes whose `when` starts with that weekday.
2. Call `get_class_status` for each of them.
3. For each class note booked places, capacity and places left, and any rule break:
   - more booked places than capacity;
   - a member listed twice in `bookedMembers`.
4. Write `reports/<date>.md`:

   ```markdown
   # Daily check <date> (<weekday>)

   | Time | Class | Booked | Places left |
   | ---- | ----- | ------ | ----------- |

   ## Rule breaks

   <each break and the class it is in, or "None.">
   ```

   With no class that day, write the heading and "No classes today."

Book and cancel nothing: fixing a rule break is the front desk's decision. End with one line saying where the report is and whether it found breaks.
