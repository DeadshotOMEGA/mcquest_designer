#!/usr/bin/env python3
"""Create GitHub issues from tasks.yaml"""

import yaml
import subprocess
import sys
import time

def create_issue(task, milestone_title):
    """Create a single GitHub issue from a task."""
    task_id = task['id']
    title = f"[{task_id}] {task['title']}"

    # Build body
    body_parts = [
        f"## Description\n{task['description']}",
        "",
        f"**Estimated Hours:** {task.get('estimated_hours', 'TBD')}",
        f"**Agent Type:** {task.get('agent', 'programmer')}",
    ]

    # Dependencies
    deps = task.get('depends_on', [])
    if deps:
        body_parts.append(f"**Dependencies:** {', '.join(deps)}")

    # Files
    files = task.get('files', [])
    if files:
        body_parts.append("\n## Files to Create/Modify")
        for f in files:
            action = f.get('action', 'modify')
            body_parts.append(f"- `{f['path']}` ({action})")

    # Acceptance criteria
    criteria = task.get('acceptance_criteria', [])
    if criteria:
        body_parts.append("\n## Acceptance Criteria")
        for c in criteria:
            body_parts.append(f"- [ ] {c}")

    # Doc references
    refs = task.get('doc_references', [])
    if refs:
        body_parts.append("\n## References")
        for r in refs:
            body_parts.append(f"- `{r}`")

    body = "\n".join(body_parts)

    # Build labels
    labels = task.get('labels', [])
    labels.append(f"milestone:m{task['milestone'][-1].lower()}")

    # Create issue via gh CLI
    cmd = [
        'gh', 'issue', 'create',
        '--title', title,
        '--body', body,
        '--milestone', milestone_title,
    ]

    for label in labels:
        cmd.extend(['--label', label])

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        issue_url = result.stdout.strip()
        print(f"✓ Created: {task_id} -> {issue_url}")
        return issue_url
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed: {task_id} - {e.stderr}")
        return None

def main():
    if len(sys.argv) < 2:
        print("Usage: python create-issues.py <milestone> [--dry-run]")
        print("  milestone: M1, M2, M1+M2, ALL")
        sys.exit(1)

    target = sys.argv[1].upper()
    dry_run = '--dry-run' in sys.argv

    # Load tasks
    with open('docs/plans/mcquest_designer-implementation-roadmap/tasks.yaml', 'r') as f:
        data = yaml.safe_load(f)

    tasks = data['tasks']

    # Filter by milestone - use milestone titles for gh CLI
    milestone_titles = {
        'M1': 'M1 - Foundation',
        'M2': 'M2 - Editor',
        'M3': 'M3 - Versioning',
        'M4': 'M4 - Export',
        'M5': 'M5 - Sharing',
    }

    if target == 'M1':
        tasks = [t for t in tasks if t['milestone'] == 'M1']
        milestones = {'M1': milestone_titles['M1']}
    elif target == 'M2':
        tasks = [t for t in tasks if t['milestone'] == 'M2']
        milestones = {'M2': milestone_titles['M2']}
    elif target == 'M3':
        tasks = [t for t in tasks if t['milestone'] == 'M3']
        milestones = {'M3': milestone_titles['M3']}
    elif target == 'M4':
        tasks = [t for t in tasks if t['milestone'] == 'M4']
        milestones = {'M4': milestone_titles['M4']}
    elif target == 'M5':
        tasks = [t for t in tasks if t['milestone'] == 'M5']
        milestones = {'M5': milestone_titles['M5']}
    elif target == 'M1+M2':
        tasks = [t for t in tasks if t['milestone'] in ('M1', 'M2')]
        milestones = {'M1': milestone_titles['M1'], 'M2': milestone_titles['M2']}
    elif target == 'M3+M4+M5':
        tasks = [t for t in tasks if t['milestone'] in ('M3', 'M4', 'M5')]
        milestones = {'M3': milestone_titles['M3'], 'M4': milestone_titles['M4'], 'M5': milestone_titles['M5']}
    elif target == 'ALL':
        milestones = milestone_titles.copy()
    else:
        print(f"Unknown milestone: {target}")
        print("Valid options: M1, M2, M3, M4, M5, M1+M2, M3+M4+M5, ALL")
        sys.exit(1)

    print(f"Creating {len(tasks)} issues for {target}...")

    if dry_run:
        print("\n[DRY RUN - no issues will be created]\n")
        for task in tasks:
            print(f"Would create: [{task['id']}] {task['title']}")
        return

    created = 0
    failed = 0

    for task in tasks:
        milestone_title = milestones.get(task['milestone'], 'M1 - Foundation')
        result = create_issue(task, milestone_title)
        if result:
            created += 1
        else:
            failed += 1
        # Rate limit - GitHub API allows ~5000/hour but be gentle
        time.sleep(0.5)

    print(f"\nDone! Created: {created}, Failed: {failed}")

if __name__ == '__main__':
    main()
