#!/bin/sh

# Traycer Git Commit Script
# Available environment variables:
#   $COMMIT_MESSAGE - Generated commit message
#   $PHASE_TITLE - Phase title
#   $PHASE_ID - Phase ID
#   $WORKSPACE_PATH - Workspace root path

# Validate required environment variables
if [ -z "$WORKSPACE_PATH" ]; then
  echo "Error: WORKSPACE_PATH environment variable is not set" >&2
  exit 1
fi

if [ -z "$COMMIT_MESSAGE" ]; then
  echo "Error: COMMIT_MESSAGE environment variable is not set" >&2
  exit 1
fi

# Change to workspace directory
cd "$WORKSPACE_PATH" || {
  echo "Error: Failed to change to workspace directory: $WORKSPACE_PATH" >&2
  exit 1
}

# Check if we're in a git repository
CURRENT_DIR=$(pwd)
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "Error: Not a git repository" >&2
  echo "Current directory: $CURRENT_DIR" >&2
  echo "To initialize a git repository, run: git init" >&2
  exit 1
fi

# Check if there are any changes to commit (staged or unstaged)
if git diff --cached --quiet && git diff --quiet; then
  # No changes at all
  echo "Warning: No changes to commit" >&2
  exit 0
fi

# Retry logic to handle transient failures
MAX_RETRIES=3
ATTEMPT=1
EXIT_CODE=1

while [ $ATTEMPT -le $MAX_RETRIES ]; do
  # Stage all changes
  if ! git add -A; then
    echo "Error: Failed to stage changes (attempt $ATTEMPT/$MAX_RETRIES)" >&2
    EXIT_CODE=1
  else
    # Check if there are staged changes before committing
    if git diff --cached --quiet; then
      echo "Warning: No changes staged after git add -A" >&2
      exit 0
    fi
    
    # Commit the changes
    if git commit -m "$COMMIT_MESSAGE"; then
      EXIT_CODE=0
      break
    else
      EXIT_CODE=$?
      echo "Error: Failed to commit (attempt $ATTEMPT/$MAX_RETRIES)" >&2
    fi
  fi

  if [ $ATTEMPT -lt $MAX_RETRIES ]; then
    sleep 0.5
  fi
  ATTEMPT=$((ATTEMPT + 1))
done

exit $EXIT_CODE
