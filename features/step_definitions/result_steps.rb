Given /^result (.*) for test "(.+)"(?: is(?: (new) and)?(?: (passing|failing) and)?(?: (active|inactive) and)?)? was run(?: (\d*) ((?:day|week)s?) ago)? by (.+?)(?: and took (\d+) second(?:s) to run)? for payload (.+?)(?: at index (\d+))? with version (.+)$/ do |name,test_name,new_test,passing,active,interval_count,interval,runner_name,execution_time,payload_name,payload_index,project_version|
  runner = named_record runner_name
  project_version = named_record project_version
  payload = named_record payload_name

  date = if interval_count
    interval_count.to_i.send(interval).ago
  else
    Time.now
  end

  options = {
    name: test_name,
    runner: runner,
    project_version: project_version,
    test_payload: payload,
    run_at: date
  }

  options[:test] = named_record test_name

  if passing
    options[:passed] = passing == 'passing'
  end

  if active
    options[:active] = active == 'active'
  end

  options[:new_test] = new_test == 'new'

  if execution_time
    options[:duration] = execution_time.to_i
  end

  options[:payload_index] = if payload_index
    payload_index
  else
    TestResult.select('COALESCE(MAX(payload_index) + 1, 0) as next_payload_index').where('test_payload_id = ?', payload.id).take.next_payload_index
  end

  add_named_record name, create(:test_result, options)
end