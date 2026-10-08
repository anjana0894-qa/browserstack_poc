# SauceDemo Login Test Plan

## Application Overview

Saucedemo login coverage for the public Swag Labs app. Focus on successful authentication, required-field validation, bad credentials, and locked-out account handling in a fresh browser state.

## Test Scenarios

### 1. Login Flow

**Seed:** `tests/seed.spec.ts`

#### 1.1. Valid login with standard user

**File:** `tests/login/valid-login.spec.ts`

**Steps:**
  1. Open https://www.saucedemo.com/ in a fresh browser session.
    - expect: The login page loads with the username field, password field, and Login button visible.
  2. Leave the username and password fields blank and then enter 'standard_user' into the username field and 'secret_sauce' into the password field.
    - expect: The fields accept the values without truncation or formatting issues.
  3. Click the Login button.
    - expect: The user is redirected to the products inventory page at /inventory.html.
    - expect: The page shows the inventory list and the hamburger menu or shopping cart controls.

#### 1.2. Empty credentials submission

**File:** `tests/login/empty-credentials.spec.ts`

**Steps:**
  1. Open the login page in a fresh browser state with blank fields.
    - expect: The Username and Password inputs are empty by default.
  2. Click the Login button without entering any values.
    - expect: The page remains on the login screen.
    - expect: The error message 'Epic sadface: Username is required' is displayed.
  3. Verify the message is visible and the form is not submitted.
    - expect: No redirection to the inventory page occurs.
    - expect: The login form stays active and the error banner is shown.

#### 1.3. Username-only submission

**File:** `tests/login/username-only.spec.ts`

**Steps:**
  1. Open the login page in a fresh browser state.
    - expect: The form is ready for input.
  2. Enter 'standard_user' into the Username field and leave the Password field empty.
    - expect: The password field remains empty.
  3. Click Login.
    - expect: The login attempt is rejected.
    - expect: The error message 'Epic sadface: Password is required' is visible.
    - expect: The user remains on the login page.

#### 1.4. Password-only submission

**File:** `tests/login/password-only.spec.ts`

**Steps:**
  1. Open the login page in a fresh state.
    - expect: The login form is visible.
  2. Leave the Username field empty and enter 'secret_sauce' into the Password field.
    - expect: The username field remains empty.
  3. Click Login.
    - expect: The login attempt is rejected.
    - expect: The error message 'Epic sadface: Username is required' is visible.
    - expect: The user remains on the login page.

#### 1.5. Invalid credentials rejection

**File:** `tests/login/invalid-credentials.spec.ts`

**Steps:**
  1. Open the login page in a fresh browser state.
    - expect: The login form is visible and empty.
  2. Enter a valid username such as 'standard_user' with an incorrect password such as 'wrong_password'.
    - expect: The values are accepted by the form.
  3. Click Login.
    - expect: The user remains on the login page.
    - expect: The error message 'Epic sadface: Username and password do not match any user in this service' is displayed.

#### 1.6. Locked-out user rejection

**File:** `tests/login/locked-user.spec.ts`

**Steps:**
  1. Open the login page in a fresh browser state.
    - expect: The login form is visible.
  2. Enter the locked account username 'locked_out_user' and the valid password 'secret_sauce'.
    - expect: The credentials are entered without issue.
  3. Click Login.
    - expect: The login attempt is rejected.
    - expect: The error message 'Epic sadface: Sorry, this user has been locked out.' is displayed.
    - expect: The user stays on the login page.

#### 1.7. Usernames list and password guidance UI

**File:** `tests/login/credentials-help.spec.ts`

**Steps:**
  1. Open the login page in a fresh browser state.
    - expect: The page shows the accepted usernames list and the shared password hint.
  2. Review the visible credential guidance text on the page.
    - expect: The page lists multiple usernames including 'standard_user' and 'locked_out_user', and shows 'secret_sauce' as the shared password.
  3. Use the visible guidance to attempt a supported login path.
    - expect: The guidance matches the actual valid credentials used in the application.
