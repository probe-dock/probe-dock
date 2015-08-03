module ModelExpectations
  def expect_user json

    @errors = Errors.new
    json = json.with_indifferent_access

    user = expect_record User, json

    @errors.compare user.name, json[:name], :name
    @errors.compare user.technical, json[:technical], :technical
    @errors.compare user.memberships.first.try(:organization).try(:api_id), json[:organizationId], :organization_id
    @errors.compare user.active, json[:active], :active
    @errors.compare user.roles.to_a.collect(&:to_s).sort, json[:roles].try(:sort), :roles
    @errors.compare user.created_at.iso8601(3), json[:createdAt], :created_at

    if json.key? :primaryEmail
      @errors.compare user.primary_email.address, json[:primaryEmail], :primary_email
    end

    if json.key? :primaryEmailMd5
      @errors.compare Digest::MD5.hexdigest(user.primary_email.address), json[:primaryEmailMd5], :primary_email_md5
    end

    if !json.key?(:primaryEmail) && !json.key?(:primaryEmailMd5)
      @errors.ensure_blank user.primary_email.try(:address), :primary_email
    end

    if json.key? :emails
      @errors.compare user.emails.collect(&:address).sort, json[:emails].sort, :emails
    else
      @errors.ensure_blank user.emails.collect(&:address), :emails
    end

    if json[:technical]
      @errors << %/expected user to have no password, but it has a password digest/ unless user.password_digest.nil?
      @errors << %/expected user to have exactly one membership, found #{user.memberships.length}/ unless user.memberships.length == 1
    end

    expect_no_errors
  end

  private

  def expect_record model, json
    record = model.where(api_id: json[:id]).first
    trigger_errors %/expected to find the following #{model} in the database, but it was not found:\n\n#{JSON.pretty_generate(json)}/ if record.blank?
    record
  end

  class Errors
    attr_reader :errors

    def initialize
      @errors = []
    end

    def << error
      @errors << error
    end

    def compare actual, expected, error
      if actual != expected
        error = %/expected :#{error} to be #{expected.inspect}, but got #{actual.inspect}/ if error.kind_of? Symbol
        @errors << error
        false
      else
        true
      end
    end

    def ensure_blank actual, error
      if actual.present?
        error = %/expected :#{error} to be blank, but got #{actual.inspect}/ if error.kind_of? Symbol
        @errors << error
        false
      else
        true
      end
    end
  end

  def trigger_errors error
    @errors.errors << error
    expect_no_errors
  end

  def expect_no_errors
    expect(@errors.errors).to be_empty, ->{ "\n#{@errors.errors.join("\n")}\n\n" }
  end
end
