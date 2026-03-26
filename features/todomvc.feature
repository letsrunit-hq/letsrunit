Feature: TodoMVC

  Background:
    Given I'm on page "https://todomvc.com/examples/react/dist/"

  Scenario: Full workflow

    # ── Add todos ──────────────────────────────────────────────────────────────
    When I set field "What needs to be done?" to "Buy groceries"
    And I press "Enter"
    And I set field "What needs to be done?" to "Walk the dog"
    And I press "Enter"
    And I set field "What needs to be done?" to "Read a book"
    And I press "Enter"
    Then the page contains text "3 items left"
    And the page contains text "Buy groceries"
    And the page contains text "Walk the dog"
    And the page contains text "Read a book"

    # ── Complete a todo ────────────────────────────────────────────────────────
    When I check field "Buy groceries"
    Then the page contains text "2 items left"

    # ── Filter: Active ────────────────────────────────────────────────────────
    When I click link "Active"
    Then the page contains text "Walk the dog"
    And the page contains text "Read a book"
    And the page does not contain text "Buy groceries"

    # ── Filter: Completed ─────────────────────────────────────────────────────
    When I click link "Completed"
    Then the page contains text "Buy groceries"
    And the page does not contain text "Walk the dog"
    And the page does not contain text "Read a book"

    # ── Clear completed ───────────────────────────────────────────────────────
    When I click button "Clear completed"
    Then the page does not contain text "Buy groceries"

    # ── Filter: All ───────────────────────────────────────────────────────────
    When I click link "All"
    Then the page contains text "Walk the dog"
    And the page contains text "Read a book"
    And the page contains text "2 items left"

    # ── Edit a todo ───────────────────────────────────────────────────────────
    When I double-click text "Walk the dog"
    And I press "Control+A"
    And I type "Walk the cat"
    And I press "Enter"
    Then the page contains text "Walk the cat"
    And the page does not contain text "Walk the dog"

    # ── Mark all as complete ──────────────────────────────────────────────────
    When I set field "What needs to be done?" to "Finish the plan"
    And I press "Enter"
    And I check `#toggle-all`
    Then the page contains text "0 items left"
    When I click link "Completed"
    Then the page contains text "Walk the cat"
    And the page contains text "Finish the plan"
