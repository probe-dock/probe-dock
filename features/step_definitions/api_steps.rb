When /(\w+) authenticates by POSTing to \/api\/authentication with Basic password (.*)/ do |user_name,password|

  store_model_counts

  user = User.where(name: user_name).first!
  header 'Authorization', %/Basic #{Base64.strict_encode64("#{user.name}:#{password}")}/

  @response = post '/api/authentication'
  @response_body = MultiJson.load @response.body
end

When /(\w+) POSTs JSON to (.*) with:/ do |user_name,api_path,properties|

  store_model_counts

  user = User.where(name: user_name).first!
  header 'Content-Type', 'application/json'
  header 'Authorization', "Bearer #{user.generate_auth_token}"

  body = {}

  properties.hashes.each do |h|
    name, value = h['property'], h['value']

    if m = value.match(/^@idOf: (.*)$/)
      body[name] = named_record(m[1]).api_id
    else
      body[name] = if value == 'true'
        true
      elsif value == 'false'
        false
      else
        value
      end
    end
  end

  @request_body = body
  @response = post api_path, MultiJson.dump(@request_body)
  @response_body = MultiJson.load @response.body
end

Then /the response code should be (\d+)/ do |code|
  expect_http_status_code code.to_i
end

Then /the response body should include in addition to the request body:/ do |properties|

  expected = @request_body.dup

  properties.hashes.each do |h|
    name, value = h['property'], h['value']

    expected[name] = if value == '@alphanumeric'
      /\A[a-z0-9]+\Z/
    elsif value == '@iso8601'
      /.*/ # TODO: validate ISO 8601 dates
    elsif value == 'true'
      true
    elsif value == 'false'
      false
    elsif value == '[]'
      []
    else
      value
    end
  end

  expect_json @response_body, expected
end

Then /the response should be HTTP (\d+) with the following errors:/ do |code,properties|

  expect_http_status_code code.to_i

  expected_errors = []

  properties.hashes.each do |h|
    expected_error = {}
    expected_error[:path] = h['path'].to_s.strip if h.key? 'path'
    expected_error[:message] = h['message'].to_s.strip if h.key? 'message'
    expected_errors << expected_error
  end

  expect(@response_body).to have_api_errors(expected_errors)
end
