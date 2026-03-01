#!/usr/bin/env python3

with open("app/profile/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix grid columns
content = content.replace("grid grid-cols-1 lg:grid-cols-2 gap-6\n          { /* Achievements */}", "grid grid-cols-1 lg:grid-cols-3 gap-6\n          { /* Skills Radar */}\n          <Card>\n            <CardHeader>\n              <h2 className=\"text-xl font-display font-bold text-gray-900 dark:text-white\">\n                Skills\n              </h2>\n            </CardHeader>\n            <CardContent>\n              <SkillRadar \n                data={calculateSkillsFromProgress(\n                  completedCourses,\n                  stats?.lessonsCompleted || 0\n                )} \n                title=\"\"\n                size=\"medium\"\n              />\n            </CardContent>\n          </Card>\n\n          { /* Achievements */}")

with open("app/profile/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Done!")
