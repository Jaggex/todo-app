import { test, expect } from "@playwright/test";

const RUN_ID = Date.now();
const TAG_TESTI = `testi-${RUN_ID}`;
const TAG_FRONTEND = `frontend-${RUN_ID}`;
const TAG_BACKEND = `backend-${RUN_ID}`;
const TASK_1 = `testi tehtävä ${RUN_ID}`;
const TASK_2 = `testi 2 ${RUN_ID}`;
const TASK_3 = `testi 3 ${RUN_ID}`;

// All tests start already authenticated via global setup (e2e/global-setup.ts)

test("landing page redirects authenticated user to app", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Worktasks/);
  await expect(page.getByRole("link", { name: "New task" })).toBeVisible();
});

test("create task with title, message, scope and tag", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const newTaskLink = page.getByRole("link", { name: "New task" });
  await expect(newTaskLink).toBeVisible({ timeout: 10_000 });
  await newTaskLink.click();

  const createSection = page.locator("section").filter({ hasText: "Create new task" });
  await expect(createSection.getByPlaceholder("Title")).toBeVisible();

  await createSection.getByPlaceholder("Title").fill(TASK_1);
  await createSection.getByPlaceholder("Message (optional)").fill("testi testi testi");

  const personalBtn = createSection.getByRole("button", { name: "Personal" });
  if (await personalBtn.isVisible()) {
    await personalBtn.click();
  }

  // Open tag input and create three tags
  await createSection.getByRole("button", { name: "+ Tag" }).click();

  await createSection.getByPlaceholder("New tag name").fill(TAG_TESTI);
  await createSection.getByRole("button", { name: "Create" }).click();
  await expect(createSection.getByRole("button", { name: TAG_TESTI })).toBeVisible();
  await page.waitForTimeout(500);

  await createSection.getByPlaceholder("New tag name").fill(TAG_FRONTEND);
  await createSection.getByRole("button", { name: "Create" }).click();
  await expect(createSection.getByRole("button", { name: TAG_FRONTEND })).toBeVisible();
  await page.waitForTimeout(500);

  await createSection.getByPlaceholder("New tag name").fill(TAG_BACKEND);
  await createSection.getByRole("button", { name: "Create" }).click();
  await expect(createSection.getByRole("button", { name: TAG_BACKEND })).toBeVisible();
  await page.waitForTimeout(500);

  await page.getByRole("button", { name: "Add task" }).click();
  await page.waitForURL("/", { timeout: 10_000 });
});

test("create tasks testi 2 and testi 3 with existing tags", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const createSection = page.locator("section").filter({ hasText: "Create new task" });

  // --- Task: testi 2 with tag frontend ---
  await page.getByRole("link", { name: "New task" }).click();
  await expect(createSection.getByPlaceholder("Title")).toBeVisible();

  await createSection.getByPlaceholder("Title").fill(TASK_2);
  await createSection.getByRole("button", { name: TAG_FRONTEND }).click();
  await page.getByRole("button", { name: "Add task" }).click();
  await page.waitForURL("/", { timeout: 10_000 });
  await page.waitForLoadState("networkidle");

  // --- Task: testi 3 with tag backend ---
  await page.getByRole("link", { name: "New task" }).click();
  await expect(createSection.getByPlaceholder("Title")).toBeVisible();

  await createSection.getByPlaceholder("Title").fill(TASK_3);
  await createSection.getByRole("button", { name: TAG_BACKEND }).click();
  await page.getByRole("button", { name: "Add task" }).click();
  await page.waitForURL("/", { timeout: 10_000 });
});

test("filter tasks by tag", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const filterBar = page.locator("div").filter({ hasText: /^Filter:/ }).first();

  // Filter by frontend — testi tehtävä and testi 2 visible, testi 3 not
  await filterBar.getByRole("button", { name: TAG_FRONTEND }).click();
  await page.waitForLoadState("networkidle");

  await expect(page.getByText(TASK_1, { exact: true })).toBeVisible();
  await expect(page.getByText(TASK_2, { exact: true })).toBeVisible();
  await expect(page.getByText(TASK_3, { exact: true })).not.toBeVisible();

  // Deselect frontend — all tasks visible
  await filterBar.getByRole("button", { name: TAG_FRONTEND }).click();
  await page.waitForLoadState("networkidle");

  await expect(page.getByText(TASK_1, { exact: true })).toBeVisible();
  await expect(page.getByText(TASK_2, { exact: true })).toBeVisible();
  await expect(page.getByText(TASK_3, { exact: true })).toBeVisible();

  // Filter by backend — testi tehtävä and testi 3 visible, testi 2 not
  await filterBar.getByRole("button", { name: TAG_BACKEND }).click();
  await page.waitForLoadState("networkidle");

  await expect(page.getByText(TASK_1, { exact: true })).toBeVisible();
  await expect(page.getByText(TASK_3, { exact: true })).toBeVisible();
  await expect(page.getByText(TASK_2, { exact: true })).not.toBeVisible();
});

test("delete tags from new task form", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.getByRole("link", { name: "New task" }).click();

  const createSection = page.locator("section").filter({ hasText: "Create new task" });
  await expect(createSection.getByPlaceholder("Title")).toBeVisible();

  // Auto-accept the confirm() dialog for all deletes
  page.on("dialog", (dialog) => dialog.accept());

  for (const tagName of [TAG_TESTI, TAG_FRONTEND, TAG_BACKEND]) {
    const tagBtn = createSection.getByRole("button", { name: tagName });
    await tagBtn.hover();
    await createSection.getByTitle(`Delete "${tagName}" tag`).click();
    await expect(tagBtn).not.toBeVisible();
  }

  // Close the task creation window
  await page.getByRole("link", { name: "Close" }).click();
  await expect(createSection).not.toBeVisible();

  // Delete the test tasks

  for (const taskTitle of [TASK_1, TASK_2, TASK_3]) {
    const taskRow = page
      .locator("div")
      .filter({ has: page.getByText(taskTitle, { exact: true }) })
      .filter({ has: page.getByRole("button", { name: "Delete" }) })
      .last();
    await taskRow.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText(taskTitle, { exact: true })).not.toBeVisible();
  }

  // Wait for all delete server actions to persist, then verify with a fresh load
  await page.waitForLoadState("networkidle");
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  for (const taskTitle of [TASK_1, TASK_2, TASK_3]) {
    await expect(page.getByText(taskTitle, { exact: true })).not.toBeVisible();
  }
});

test("create task, mark as completed, verify on completed page, then delete", async ({ page }) => {
  const taskTitle = `completed task test ${RUN_ID}`;

  // Create the task
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: "New task" }).click();

  const createSection = page.locator("section").filter({ hasText: "Create new task" });
  await expect(createSection.getByPlaceholder("Title")).toBeVisible();
  await createSection.getByPlaceholder("Title").fill(taskTitle);
  await page.getByRole("button", { name: "Add task" }).click();
  await page.waitForURL("/", { timeout: 10_000 });

  // Mark the task as completed
  const taskRow = page
    .locator("div")
    .filter({ has: page.getByText(taskTitle, { exact: true }) })
    .filter({ has: page.getByRole("button", { name: "Delete" }) })
    .last();
  await taskRow.getByLabel("Complete").check();
  await expect(page.getByText(taskTitle, { exact: true })).not.toBeVisible();

  // Navigate to completed page and verify the task is there
  await page.waitForLoadState("networkidle");
  await page.goto("/completed");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(taskTitle, { exact: true })).toBeVisible();

  // Delete the completed task
  page.on("dialog", (dialog) => dialog.accept());
  const completedRow = page
    .locator("div")
    .filter({ has: page.getByText(taskTitle, { exact: true }) })
    .filter({ has: page.getByRole("button", { name: "Delete" }) })
    .last();
  await completedRow.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText(taskTitle, { exact: true })).not.toBeVisible();
});

test("create 3 tasks, mark as completed, bulk delete on completed page", async ({ page }) => {
  const bulkTitles = [`bulk delete 1 ${RUN_ID}`, `bulk delete 2 ${RUN_ID}`, `bulk delete 3 ${RUN_ID}`];

  // Create all three tasks
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  for (const title of bulkTitles) {
    await page.getByRole("link", { name: "New task" }).click();
    const createSection = page.locator("section").filter({ hasText: "Create new task" });
    await expect(createSection.getByPlaceholder("Title")).toBeVisible();
    await createSection.getByPlaceholder("Title").fill(title);
    await page.getByRole("button", { name: "Add task" }).click();
    await page.waitForURL("/", { timeout: 10_000 });
  }

  // Mark each task as completed
  page.on("dialog", (dialog) => dialog.accept());

  for (const title of bulkTitles) {
    const taskRow = page
      .locator("div")
      .filter({ has: page.getByText(title, { exact: true }) })
      .filter({ has: page.getByRole("button", { name: "Delete" }) })
      .last();
    await taskRow.getByLabel("Complete").check();
    await expect(page.getByText(title, { exact: true })).not.toBeVisible();
  }

  // Navigate to completed page
  await page.getByRole("link", { name: "Completed" }).click();
  await page.waitForLoadState("networkidle");

  // Verify all three tasks are visible
  for (const title of bulkTitles) {
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  }

  // Select all and bulk delete
  await page.getByRole("button", { name: "Select all" }).click();
  await expect(page.getByRole("button", { name: /Delete selected/ })).toBeVisible();
  await page.getByRole("button", { name: /Delete selected/ }).click();

  // Verify all tasks are gone
  for (const title of bulkTitles) {
    await expect(page.getByText(title, { exact: true })).not.toBeVisible();
  }
});

test("create workspace, create shared task, verify it, delete it, then delete workspace", async ({ page }) => {
  const workspaceName = `e2e test workspace ${RUN_ID}`;
  const sharedTaskTitle = `shared e2e task ${RUN_ID}`;

  // Create the workspace
  await page.goto("/workspaces");
  await page.waitForLoadState("networkidle");

  await page.locator('input[name="name"]').fill(workspaceName);
  await page.getByRole("button", { name: "Create workspace" }).click();

  // Should redirect to workspace settings page
  await page.waitForURL(/\/workspaces\/.+/, { timeout: 10_000 });
  await expect(page.getByText(workspaceName)).toBeVisible();

  // Go to main page and create a shared task
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: "New task" }).click();

  const createSection = page.locator("section").filter({ hasText: "Create new task" });
  await expect(createSection.getByPlaceholder("Title")).toBeVisible();
  await createSection.getByPlaceholder("Title").fill(sharedTaskTitle);

  // Switch to Shared scope
  await createSection.getByRole("button", { name: "Shared" }).click();

  await page.getByRole("button", { name: "Add task" }).click();
  await page.waitForURL("/", { timeout: 10_000 });

  // Force a fresh SSR load so the new shared task is included in the server-rendered page
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const workspaceSection = page.locator("section").filter({ hasText: `${workspaceName} — Shared Tasks` });
  await expect(workspaceSection.getByText(sharedTaskTitle, { exact: true })).toBeVisible();

  // Delete the shared task
  page.on("dialog", (dialog) => dialog.accept());
  const taskRow = workspaceSection
    .locator("div")
    .filter({ has: page.getByText(sharedTaskTitle, { exact: true }) })
    .filter({ has: page.getByRole("button", { name: "Delete" }) })
    .last();
  await taskRow.getByRole("button", { name: "Delete" }).click();
  await expect(workspaceSection.getByText(sharedTaskTitle, { exact: true })).not.toBeVisible();

  // Navigate to workspace settings and delete the workspace
  await page.getByRole("link", { name: "Workspaces" }).click();
  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: workspaceName }).click();
  await page.waitForURL(/\/workspaces\/.+/, { timeout: 10_000 });

  await page.getByRole("button", { name: "Delete workspace" }).click();

  // Should redirect back to /workspaces after deletion
  await page.waitForURL("/workspaces", { timeout: 10_000 });
  await expect(page.getByText(workspaceName)).not.toBeVisible();
});

test("create workspace, create 3 shared tasks, bulk delete them, then delete workspace", async ({ page }) => {
  const workspaceName = `e2e bulk shared workspace ${RUN_ID}`;
  const sharedTitles = [`shared bulk 1 ${RUN_ID}`, `shared bulk 2 ${RUN_ID}`, `shared bulk 3 ${RUN_ID}`];

  // Create the workspace
  await page.goto("/workspaces");
  await page.waitForLoadState("networkidle");
  await page.locator('input[name="name"]').fill(workspaceName);
  await page.getByRole("button", { name: "Create workspace" }).click();
  await page.waitForURL(/\/workspaces\/.+/, { timeout: 10_000 });

  // Create 3 shared tasks
  for (const title of sharedTitles) {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByRole("link", { name: "New task" }).click();

    const createSection = page.locator("section").filter({ hasText: "Create new task" });
    await expect(createSection.getByPlaceholder("Title")).toBeVisible();
    await createSection.getByPlaceholder("Title").fill(title);
    await createSection.getByRole("button", { name: "Shared" }).click();
    await page.getByRole("button", { name: "Add task" }).click();
    await page.waitForURL("/", { timeout: 10_000 });
  }

  // Force a fresh SSR load so all new shared tasks are included
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const workspaceSection = page.locator("section").filter({ hasText: `${workspaceName} — Shared Tasks` });
  for (const title of sharedTitles) {
    await expect(workspaceSection.getByText(title, { exact: true })).toBeVisible();
  }

  // Select all and bulk delete
  await workspaceSection.getByRole("button", { name: "Select all" }).click();
  await expect(workspaceSection.getByRole("button", { name: /Delete selected/ })).toBeVisible();
  await workspaceSection.getByRole("button", { name: /Delete selected/ }).click();

  // Confirm all tasks are gone
  for (const title of sharedTitles) {
    await expect(workspaceSection.getByText(title, { exact: true })).not.toBeVisible();
  }

  // Clean up: delete the workspace
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("link", { name: "Workspaces" }).click();
  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: workspaceName }).click();
  await page.waitForURL(/\/workspaces\/.+/, { timeout: 10_000 });
  await page.getByRole("button", { name: "Delete workspace" }).click();
  await page.waitForURL("/workspaces", { timeout: 10_000 });
  await expect(page.getByText(workspaceName)).not.toBeVisible();
});

test("edit task — update title and message", async ({ page }) => {
  const ts = Date.now();
  const originalTitle = `task to edit ${ts}`;
  const updatedTitle = `edited task ${ts}`;
  const updatedMessage = "updated message content";

  // Create the task
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: "New task" }).click();
  const createSection = page.locator("section").filter({ hasText: "Create new task" });
  await expect(createSection.getByPlaceholder("Title")).toBeVisible();
  await createSection.getByPlaceholder("Title").fill(originalTitle);
  await page.getByRole("button", { name: "Add task" }).click();
  await page.waitForURL("/", { timeout: 10_000 });
  await page.waitForLoadState("networkidle");

  // Click Edit
  const taskRow = page
    .locator("div")
    .filter({ has: page.getByText(originalTitle, { exact: true }) })
    .filter({ has: page.getByRole("button", { name: "Delete" }) })
    .last();
  await taskRow.getByRole("button", { name: "Edit", exact: true }).click();

  // Edit form should appear
  const editForm = page.locator("form").filter({ has: page.locator('input[name="title"]') });
  await expect(editForm).toBeVisible();
  await editForm.locator('input[name="title"]').fill(updatedTitle);
  await editForm.locator('textarea[name="message"]').fill(updatedMessage);
  await editForm.getByRole("button", { name: "Save" }).click();

  // Verify the updated title appears and original does not
  await expect(page.getByText(updatedTitle, { exact: true })).toBeVisible();
  await expect(page.getByText(originalTitle, { exact: true })).not.toBeVisible();

  // Expand to verify message
  await page.getByText(updatedTitle, { exact: true }).click();
  await expect(page.getByText(updatedMessage, { exact: true })).toBeVisible();

  // Clean up
  page.on("dialog", (dialog) => dialog.accept());
  const updatedRow = page
    .locator("div")
    .filter({ has: page.getByText(updatedTitle, { exact: true }) })
    .filter({ has: page.getByRole("button", { name: "Delete" }) })
    .last();
  await updatedRow.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText(updatedTitle, { exact: true })).not.toBeVisible();
});

test("task search filters results", async ({ page }) => {
  const taskA = `unique searchable alpha ${RUN_ID}`;
  const taskB = `unique searchable beta ${RUN_ID}`;

  // Create two tasks
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  for (const title of [taskA, taskB]) {
    await page.getByRole("link", { name: "New task" }).click();
    const createSection = page.locator("section").filter({ hasText: "Create new task" });
    await expect(createSection.getByPlaceholder("Title")).toBeVisible();
    await createSection.getByPlaceholder("Title").fill(title);
    await page.getByRole("button", { name: "Add task" }).click();
    await page.waitForURL("/", { timeout: 10_000 });
    await page.waitForLoadState("networkidle");
  }

  // Search for "alpha" — only taskA visible
  await page.getByPlaceholder("Search tasks…").fill("alpha");
  await page.waitForURL(/q=alpha/, { timeout: 5_000 });
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(taskA, { exact: true })).toBeVisible();
  await expect(page.getByText(taskB, { exact: true })).not.toBeVisible();

  // Search for "beta" — only taskB visible
  await page.getByPlaceholder("Search tasks…").fill("beta");
  await page.waitForURL(/q=beta/, { timeout: 5_000 });
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(taskB, { exact: true })).toBeVisible();
  await expect(page.getByText(taskA, { exact: true })).not.toBeVisible();

  // Clear search — both visible
  await page.getByPlaceholder("Search tasks…").fill("");
  await page.waitForURL(/\/$/, { timeout: 5_000 });
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(taskA, { exact: true })).toBeVisible();
  await expect(page.getByText(taskB, { exact: true })).toBeVisible();

  // Clean up
  page.on("dialog", (dialog) => dialog.accept());
  for (const title of [taskA, taskB]) {
    const row = page
      .locator("div")
      .filter({ has: page.getByText(title, { exact: true }) })
      .filter({ has: page.getByRole("button", { name: "Delete" }) })
      .last();
    await row.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText(title, { exact: true })).not.toBeVisible();
  }
});

test("task with due date shows date label", async ({ page }) => {
  const taskTitle = `due date test task ${RUN_ID}`;
  // Use a future date so it won't be marked overdue
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dueDateInput = tomorrow.toISOString().slice(0, 10); // YYYY-MM-DD
  const expectedLabel = tomorrow.toLocaleDateString("fi-FI");

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: "New task" }).click();

  const createSection = page.locator("section").filter({ hasText: "Create new task" });
  await expect(createSection.getByPlaceholder("Title")).toBeVisible();
  await createSection.getByPlaceholder("Title").fill(taskTitle);
  await createSection.locator('input[name="dueDate"]').fill(dueDateInput);
  await page.getByRole("button", { name: "Add task" }).click();
  await page.waitForURL("/", { timeout: 10_000 });
  await page.waitForLoadState("networkidle");

  // Verify the due date label is shown next to the task title
  const taskRow = page
    .locator("div")
    .filter({ has: page.getByText(taskTitle, { exact: true }) })
    .filter({ has: page.getByRole("button", { name: "Delete" }) })
    .last();
  await expect(taskRow.getByText(expectedLabel)).toBeVisible();

  // Clean up
  page.on("dialog", (dialog) => dialog.accept());
  await taskRow.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText(taskTitle, { exact: true })).not.toBeVisible();
});

test("search on completed page filters results", async ({ page }) => {
  const ts = Date.now();
  const taskA = `completed search alpha ${ts}`;
  const taskB = `completed search beta ${ts}`;

  // Create and complete both tasks
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  page.on("dialog", (dialog) => dialog.accept());

  for (const title of [taskA, taskB]) {
    await page.getByRole("link", { name: "New task" }).click();
    const createSection = page.locator("section").filter({ hasText: "Create new task" });
    await expect(createSection.getByPlaceholder("Title")).toBeVisible();
    await createSection.getByPlaceholder("Title").fill(title);
    await page.getByRole("button", { name: "Add task" }).click();
    await page.waitForURL("/", { timeout: 10_000 });
    await page.waitForLoadState("networkidle");
  }

  for (const title of [taskA, taskB]) {
    const row = page
      .locator("div")
      .filter({ has: page.getByText(title, { exact: true }) })
      .filter({ has: page.getByRole("button", { name: "Delete" }) })
      .last();
    await row.getByLabel("Complete").check();
    await expect(page.getByText(title, { exact: true })).not.toBeVisible();
  }

  // Wait for server actions to finish, then do a full navigation for fresh data
  await page.waitForLoadState("networkidle");
  await page.goto("/completed");
  await page.waitForLoadState("networkidle");

  // Search for "alpha"
  await page.getByPlaceholder("Search tasks…").fill("alpha");
  await page.waitForURL(/q=alpha/, { timeout: 5_000 });
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(taskA, { exact: true })).toBeVisible();
  await expect(page.getByText(taskB, { exact: true })).not.toBeVisible();

  // Clear search
  await page.getByPlaceholder("Search tasks…").fill("");
  await page.waitForURL(/\/completed$/, { timeout: 5_000 });
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(taskA, { exact: true })).toBeVisible();
  await expect(page.getByText(taskB, { exact: true })).toBeVisible();

  // Bulk delete both
  await page.getByRole("button", { name: "Select all" }).click();
  await page.getByRole("button", { name: /Delete selected/ }).click();
  for (const title of [taskA, taskB]) {
    await expect(page.getByText(title, { exact: true })).not.toBeVisible();
  }
});

test("rename workspace", async ({ page }) => {
  const originalName = `rename test workspace ${RUN_ID}`;
  const renamedName = `renamed workspace ${RUN_ID}`;

  // Create workspace
  await page.goto("/workspaces");
  await page.waitForLoadState("networkidle");
  await page.locator('input[name="name"]').fill(originalName);
  await page.getByRole("button", { name: "Create workspace" }).click();
  await page.waitForURL(/\/workspaces\/.+/, { timeout: 10_000 });

  // Rename it
  const renameForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Save" }) });
  await renameForm.locator('input[type="text"]').fill(renamedName);
  await renameForm.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Workspace renamed.")).toBeVisible();

  // Verify the new name appears in the heading
  await expect(page.getByRole("heading", { name: renamedName })).toBeVisible();

  // Navigate to workspaces list and confirm renamed name shows there
  await page.getByRole("link", { name: "Workspaces" }).click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("link", { name: renamedName })).toBeVisible();
  await expect(page.getByText(originalName, { exact: true })).not.toBeVisible();

  // Clean up — delete the workspace
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("link", { name: renamedName }).click();
  await page.waitForURL(/\/workspaces\/.+/, { timeout: 10_000 });
  await page.getByRole("button", { name: "Delete workspace" }).click();
  await page.waitForURL("/workspaces", { timeout: 10_000 });
});

test("verify clean state after all tests", async ({ page }) => {
  // No pending personal tasks
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("No pending tasks.")).toBeVisible();

  // No completed tasks
  await page.goto("/completed");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("No completed tasks.")).toBeVisible();

  // No workspaces
  await page.goto("/workspaces");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("You are not a member of any workspace yet.")).toBeVisible();
});

test("account page shows user info and sign out redirects to landing", async ({ page }) => {
  // Navigate to account via user menu
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Open user menu" }).click();
  await page.getByRole("link", { name: "Account" }).click();
  await page.waitForURL("/account", { timeout: 10_000 });

  // Verify account page content
  await expect(page.getByRole("heading", { name: "Account", exact: true })).toBeVisible();
  await expect(page.getByText(/Signed in as/)).toBeVisible();

  // Sign out via user menu
  await page.getByRole("button", { name: "Open user menu" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();

  // Should land on the home/landing page (unauthenticated)
  await page.waitForURL("/", { timeout: 10_000 });
  await expect(page.getByRole("link", { name: /Sign in|Get started/i }).first()).toBeVisible();
});
