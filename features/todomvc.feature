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
    Then The page contains text "3 items left"
    And The page contains text "Buy groceries"
    And The page contains text "Walk the dog"
    And The page contains text "Read a book"

    # ── Complete a todo ────────────────────────────────────────────────────────
    When I check field "Buy groceries"
    Then The page contains text "2 items left"

    # ── Filter: Active ────────────────────────────────────────────────────────
    When I click link "Active"
    Then The page contains text "Walk the dog"
    And The page contains text "Read a book"
    And The page not contains text "Buy groceries"

    # ── Filter: Completed ─────────────────────────────────────────────────────
    When I click link "Completed"
    Then The page contains text "Buy groceries"
    And The page not contains text "Walk the dog"
    And The page not contains text "Read a book"

    # ── Clear completed ───────────────────────────────────────────────────────
    When I click button "Clear completed"
    Then The page not contains text "Buy groceries"

    # ── Filter: All ───────────────────────────────────────────────────────────
    When I click link "All"
    Then The page contains text "Walk the dog"
    And The page contains text "Read a book"
    And The page contains text "2 items left"

    # ── Edit a todo ───────────────────────────────────────────────────────────
    When I double-click text "Walk the dog"
    And I press "Control+A"
    And I type "Walk the cat"
    And I press "Enter"
    Then The page contains text "Walk the cat"
    And The page not contains text "Walk the dog"

    # ── Mark all as complete ──────────────────────────────────────────────────
    When I set field "What needs to be done?" to "Finish the plan"
    And I press "Enter"
    And I check `#toggle-all`
    Then The page contains text "0 items left"
    When I click link "Completed"
    Then The page contains text "Walk the cat"
    And The page contains text "Finish the plan"
